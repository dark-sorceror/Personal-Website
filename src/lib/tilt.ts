// Phone motion sensors as an input to the dot field: tilting leans the
// live dots like liquid in a tray, and a sharp shake fires the click
// ripple. A nod to the exoskeleton's IMU pipeline, so it reads out live.

const DEG = Math.PI / 180;
const G = 9.81;

// Low-pass on the gravity vector. The OS already fuses gyro and
// accelerometer into the orientation angles; this only takes the jitter off.
const GRAVITY_TAU_S = 0.12;
const ANGLE_TAU_S = 0.2; // the readout's roll and pitch
// People hold phones at all sorts of pitches, so "level" front-to-back
// drifts toward however the phone is held; left-right is absolute
const REST_TAU_S = 5;
// Below this much tilt from rest the dots sit still; past it the lean
// grows with this gain, so about 40 degrees tips them all the way
const DEAD_ZONE = 0.04;
const LEAN_GAIN = 1.6;

// The lean is a damped spring chasing the tilt, so a quick tilt sloshes
// past and settles
const SLOSH_HZ = 1.1;
const SLOSH_DAMPING = 0.35; // fraction of critical

// A shake is a spike in acceleration with gravity removed
export const SHAKE_THRESHOLD = 1.4 * G; // m/s²
export const SHAKE_COOLDOWN_S = 1.2;

// Event rate is counted over windows this long
const RATE_WINDOW_S = 0.5;
// Readings this soon mean no permission was needed, so no button
const ARM_DELAY_MS = 1000;
// Granted, but nothing this long after: there are no sensors
const SILENT_MS = 2000;

/** Frame-rate independent exponential low-pass step */
export function lowPass(prev: number, next: number, dt: number, tau: number) {
    return prev + (next - prev) * (1 - Math.exp(-dt / tau));
}

/**
 * Gravity's direction on screen (x right, y down, unit length when the
 * phone is vertical) from the deviceorientation angles in degrees, turned
 * by the screen orientation angle so landscape works too.
 */
export function screenGravity(
    beta: number,
    gamma: number,
    screenAngle = 0,
): [number, number] {
    // Gravity in the device frame is (cosβ sinγ, -sinβ, -cosβ cosγ) with
    // y toward the top edge; flip y to point down the screen
    const dx = Math.cos(beta * DEG) * Math.sin(gamma * DEG);
    const dy = Math.sin(beta * DEG);

    return rotate(dx, dy, screenAngle);
}

/** Device axes (x right, y down the screen) into the rotated screen's */
export function rotate(
    x: number,
    y: number,
    screenAngle: number,
): [number, number] {
    const c = Math.cos(screenAngle * DEG);
    const s = Math.sin(screenAngle * DEG);

    return [x * c + y * s, -x * s + y * c];
}

/** A 2D damped spring, stepped in fixed substeps so it stays stable */
export class Spring {
    x = 0;
    y = 0;
    private vx = 0;
    private vy = 0;

    constructor(
        private readonly hz = SLOSH_HZ,
        private readonly damping = SLOSH_DAMPING,
    ) {}

    step(tx: number, ty: number, dt: number) {
        const w = 2 * Math.PI * this.hz;
        const k = w * w;
        const c = 2 * this.damping * w;
        const n = Math.max(1, Math.ceil(dt / (1 / 240)));
        const h = dt / n;

        for (let i = 0; i < n; i++) {
            this.vx += (k * (tx - this.x) - c * this.vx) * h;
            this.vy += (k * (ty - this.y) - c * this.vy) * h;
            this.x += this.vx * h;
            this.y += this.vy * h;
        }
    }

    reset() {
        this.x = this.y = this.vx = this.vy = 0;
    }
}

/** Fires once per spike over the threshold, then waits out the cooldown */
export class ShakeDetector {
    private last = -Infinity;

    constructor(
        private readonly threshold = SHAKE_THRESHOLD,
        private readonly cooldown = SHAKE_COOLDOWN_S,
    ) {}

    /** Linear acceleration in m/s² and a time in seconds */
    feed(ax: number, ay: number, az: number, t: number) {
        if (t - this.last < this.cooldown) return false;
        if (Math.hypot(ax, ay, az) < this.threshold) return false;

        this.last = t;

        return true;
    }
}

/** Events per second, counted over short windows */
export class RateMeter {
    hz = 0;
    private count = 0;
    private from = NaN;

    tick(t: number) {
        if (Number.isNaN(this.from)) this.from = t;

        this.count++;

        const span = t - this.from;

        if (span >= RATE_WINDOW_S) {
            this.hz = (this.count - 1) / span;
            this.count = 1;
            this.from = t;
        }
    }

    reset() {
        this.hz = 0;
        this.count = 0;
        this.from = NaN;
    }
}

type Permission = () => Promise<PermissionState>;
type ShakeHandler = (dx: number, dy: number) => void;

const permissionOf = (ctor: unknown) =>
    (ctor as { requestPermission?: Permission } | undefined)?.requestPermission;

/** A phone (touch only, no hover) that reports device orientation */
export function tiltSupported() {
    return (
        typeof window !== "undefined" &&
        "DeviceOrientationEvent" in window &&
        window.matchMedia("(hover: none) and (pointer: coarse)").matches &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
}

/** iOS hides the sensors until a tap grants access */
export function tiltNeedsPermission() {
    return typeof permissionOf(window.DeviceOrientationEvent) === "function";
}

const screenAngle = () =>
    screen.orientation?.angle ??
    (Number((window as { orientation?: number }).orientation) || 0);

/**
 * The phone's sensors, shared by the dot field and the readout. Listens
 * only while someone holds it and the tab is visible.
 */
class TiltSensor {
    /** Smoothed angles for the readout, in degrees */
    roll = 0;
    pitch = 0;
    /** Smoothed gravity on screen relative to the resting hold */
    gx = 0;
    gy = 0;
    /** Orientation events per second */
    readonly rate = new RateMeter();
    /** Has a real reading arrived since the page loaded */
    live = false;
    /** No readings yet and none came on their own: a tap may unlock them */
    waiting = false;
    /** Turned down, or granted with no sensors behind it */
    unavailable = false;

    private users = 0;
    private waitTimer = 0;
    private listening = false;
    private lastT = NaN;
    private rawX = 0;
    private rawY = 0;
    private restY = NaN;
    private readonly spring = new Spring();
    private readonly shake = new ShakeDetector();
    private readonly shakeHandlers = new Set<ShakeHandler>();
    private readonly changeHandlers = new Set<() => void>();

    /** Start listening; call the returned function to stop */
    acquire() {
        if (this.users++ === 0) {
            document.addEventListener("visibilitychange", this.onVisibility);
            this.onVisibility();
        }

        if (!this.waitTimer) {
            this.waitTimer = window.setTimeout(() => {
                this.waiting = !this.live;
                this.notify();
            }, ARM_DELAY_MS);
        }

        let held = true;

        return () => {
            if (!held) return;

            held = false;

            if (--this.users === 0) {
                document.removeEventListener(
                    "visibilitychange",
                    this.onVisibility,
                );
                this.detach();
            }
        };
    }

    /** Ask iOS for access; must run inside a tap handler */
    async requestPermission() {
        const orientation = permissionOf(window.DeviceOrientationEvent);
        const motion = permissionOf(window.DeviceMotionEvent);

        if (!orientation) return true;

        // Both calls start inside the gesture; awaiting one first would
        // spend it
        const results = await Promise.all([
            orientation.call(window.DeviceOrientationEvent),
            motion?.call(window.DeviceMotionEvent) ?? "granted",
        ]).catch(() => ["denied"]);

        if (results[0] !== "granted") {
            this.unavailable = true;
            this.notify();

            return false;
        }

        window.setTimeout(() => {
            this.unavailable = !this.live;
            this.notify();
        }, SILENT_MS);

        return true;
    }

    onShake(handler: ShakeHandler) {
        this.shakeHandlers.add(handler);

        return () => void this.shakeHandlers.delete(handler);
    }

    /** Called when `live`, `waiting` or `unavailable` changes */
    onChange(handler: () => void) {
        this.changeHandlers.add(handler);

        return () => void this.changeHandlers.delete(handler);
    }

    private notify() {
        for (const handler of this.changeHandlers) handler();
    }

    /**
     * Step the slosh and return the lean, a vector of length up to 1 in
     * screen space that points downhill
     */
    lean(dt: number): [number, number] {
        let tx = this.gx;
        let ty = this.gy;
        const mag = Math.hypot(tx, ty);

        if (mag < DEAD_ZONE) {
            tx = ty = 0;
        } else {
            // Ease out of the dead zone and cap at a full tip
            const k = Math.min(1, (mag - DEAD_ZONE) * LEAN_GAIN) / mag;

            tx *= k;
            ty *= k;
        }

        this.spring.step(tx, ty, dt);

        return [this.spring.x, this.spring.y];
    }

    private attach() {
        if (this.listening) return;

        this.listening = true;
        window.addEventListener("deviceorientation", this.onOrientation);
        window.addEventListener("devicemotion", this.onMotion);
    }

    private detach() {
        if (!this.listening) return;

        this.listening = false;
        window.removeEventListener("deviceorientation", this.onOrientation);
        window.removeEventListener("devicemotion", this.onMotion);
        // Readings resume from scratch, so no stale jump after a pause
        this.lastT = NaN;
        this.rate.reset();
        this.spring.reset();
    }

    private onVisibility = () => {
        if (document.visibilityState === "visible") this.attach();
        else this.detach();
    };

    private onOrientation = (e: DeviceOrientationEvent) => {
        // Desktops fire one empty event; only real readings count
        if (e.beta === null || e.gamma === null) return;

        const t = e.timeStamp / 1000;
        const [x, y] = screenGravity(e.beta, e.gamma, screenAngle());

        this.rate.tick(t);

        if (Number.isNaN(this.lastT)) {
            this.rawX = x;
            this.rawY = y;
            this.roll = e.gamma;
            this.pitch = e.beta;
            if (Number.isNaN(this.restY)) this.restY = y;
        } else {
            // Events only come on change in some browsers, so a long gap
            // just means a jump
            const dt = t - this.lastT;

            this.rawX = lowPass(this.rawX, x, dt, GRAVITY_TAU_S);
            this.rawY = lowPass(this.rawY, y, dt, GRAVITY_TAU_S);
            this.restY = lowPass(this.restY, this.rawY, dt, REST_TAU_S);
            this.roll = lowPass(this.roll, e.gamma, dt, ANGLE_TAU_S);
            this.pitch = lowPass(this.pitch, e.beta, dt, ANGLE_TAU_S);
        }

        this.lastT = t;
        this.gx = this.rawX;
        this.gy = this.rawY - this.restY;

        if (!this.live) {
            this.live = true;
            this.notify();
        }
    };

    private onMotion = (e: DeviceMotionEvent) => {
        const a = e.acceleration;

        if (a?.x == null || a.y == null || a.z == null) return;
        if (!this.shake.feed(a.x, a.y, a.z, e.timeStamp / 1000)) return;

        // Which way the phone was flung, on screen
        const [dx, dy] = rotate(a.x, -a.y, screenAngle());
        const mag = Math.hypot(dx, dy) || 1;

        for (const handler of this.shakeHandlers) {
            handler(dx / mag, dy / mag);
        }
    };
}

export const tilt = new TiltSensor();
