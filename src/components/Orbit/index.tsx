import { useEffect, useRef } from "react";

import "./index.css";

type Vec = { x: number; y: number };

type Node = {
    pos: Vec;
    vel: Vec;
    radius: number;
    mass: number;

    orbitRadius: number;
    orbitAngle: number;
};

const TOTAL_NODE_COUNT = 200;
const ORBIT_SPEED = 0.0005;
const MOUSE_RADIUS = 100;
const MOUSE_FORCE = 0.008;
const DAMPING = 0.98;
const MAX_RADIUS = 200;
const COUNT = 100;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const MIN_NODE_RADIUS = 4;
const MAX_NODE_RADIUS = 14;

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function createNodes(canvas: HTMLCanvasElement) {
    const nodes: Node[] = [];
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    for (let i = 0; i < COUNT; i++) {
        const radius = Math.sqrt(i / COUNT) * MAX_RADIUS;
        const angle = i * GOLDEN_ANGLE;

        const sizeBias = Math.pow(i / COUNT, 0.7);

        const size =
            lerp(MIN_NODE_RADIUS, MAX_NODE_RADIUS, sizeBias) *
            (0.75 + Math.random() * 0.5);

        nodes.push({
            pos: {
                x: cx + Math.cos(angle) * radius,
                y: cy + Math.sin(angle) * radius,
            },
            vel: { x: 0, y: 0 },
            radius: size,
            mass: size,
            orbitRadius: radius,
            orbitAngle: angle,
        });
    }

    return nodes;
}

function resize(canvas: HTMLCanvasElement) {
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
}

export default function LatentField() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const nodesRef = useRef<Node[]>([]);
    const mouseRef = useRef<Vec | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        resize(canvas);

        nodesRef.current = createNodes(canvas);

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("resize", () => resize(canvas));

        let animationId: number;

        const animate = () => {
            update(nodesRef.current, canvas);
            draw(ctx, nodesRef.current, canvas);
            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationId);

            window.removeEventListener("mousemove", onMouseMove);
        };
    }, []);

    function onMouseMove(e: MouseEvent) {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio;

        mouseRef.current = {
            x: (e.clientX - rect.left) * dpr,
            y: (e.clientY - rect.top) * dpr,
        };
    }

    function update(nodes: Node[], canvas: HTMLCanvasElement) {
        const center = { x: canvas.width / 2, y: canvas.height / 2 };

        for (const node of nodes) {
            const targetX =
                center.x + Math.cos(node.orbitAngle) * node.orbitRadius;
            const targetY =
                center.y + Math.sin(node.orbitAngle) * node.orbitRadius;

            const SPRING_STRENGTH = 0.000004;

            node.vel.x += (targetX - node.pos.x) * SPRING_STRENGTH;
            node.vel.y += (targetY - node.pos.y) * SPRING_STRENGTH;

            node.vel.x += (targetX - node.pos.x) * 0.002;
            node.vel.y += (targetY - node.pos.y) * 0.002;

            if (mouseRef.current) {
                const mx = mouseRef.current.x;
                const my = mouseRef.current.y;
                const mdx = mx - node.pos.x;
                const mdy = my - node.pos.y;
                const mDist = Math.hypot(mdx, mdy);

                if (mDist < MOUSE_RADIUS) {
                    const strength = (1 - mDist / MOUSE_RADIUS) * MOUSE_FORCE;

                    node.vel.x += mdx * strength;
                    node.vel.y += mdy * strength;

                    node.vel.x *= 0.92;
                    node.vel.y *= 0.92;
                }
            }

            node.vel.x *= DAMPING;
            node.vel.y *= DAMPING;

            node.pos.x += node.vel.x;
            node.pos.y += node.vel.y;

            node.orbitAngle += ORBIT_SPEED;
        }

        resolveCollisions(nodes);
    }

    function resolveCollisions(nodes: Node[]) {
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i];
                const b = nodes[j];

                const dx = b.pos.x - a.pos.x;
                const dy = b.pos.y - a.pos.y;
                const dist = Math.hypot(dx, dy);
                const minDist = a.radius + b.radius;

                if (dist < minDist && dist > 0) {
                    const overlap = minDist - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    a.pos.x -= nx * overlap * 0.5;
                    a.pos.y -= ny * overlap * 0.5;
                    b.pos.x += nx * overlap * 0.5;
                    b.pos.y += ny * overlap * 0.5;
                }
            }
        }
    }

    function draw(
        ctx: CanvasRenderingContext2D,
        nodes: Node[],
        canvas: HTMLCanvasElement
    ) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";

        for (const node of nodes) {
            ctx.beginPath();
            ctx.arc(node.pos.x, node.pos.y, node.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    return (
        <div className="canvas-wrap">
            <canvas ref={canvasRef} className="orbit" />
        </div>
    );
}
