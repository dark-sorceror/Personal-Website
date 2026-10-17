export type GalleryImage = {
    // The picture, or for a video the still shown before it plays
    src: string;
    // Intrinsic size, so the cover can lay out before the image loads
    width: number;
    height: number;
    alt: string;
    caption: string;
    // A short silent clip that plays in place of the still
    video?: string;
    // A YouTube video, loaded only once someone presses play
    youtube?: string;
};

// Image sets keyed by project. The first entry is the project's cover; the
// rest are reachable by stepping through the lightbox.
export const GALLERIES = {
    "lumen-arch": [
        {
            src: "/media/lumen-arch/lumen-probe.svg",
            width: 1200,
            height: 700,
            alt: "Lumen decode-loop architecture",
            caption:
                "Lumen — editable context, a hand-owned MLX decode loop, and between-token inspection",
        },
        {
            src: "/media/lumen-arch/lumen-flow.svg",
            width: 1200,
            height: 700,
            alt: "Edit-and-continue workflow",
            caption:
                "Edit-and-continue — preserve the common prefix, re-prefill the changed suffix, and resume generation",
        },
    ],
    goosetriever: [
        {
            src: "/media/goosetriever/goosetriever_robot.png",
            width: 242,
            height: 161,
            alt: "Goosetriever robot",
            caption:
                "Goosetriever, winner of Best use of Huawei's Real-Time Multimodal AI at Hack the North 2026: skid-steer base, lidar underneath, SO-101 arm at the nose",
        },
        {
            src: "/media/goosetriever/goosetriever_showcase.jpg",
            width: 1280,
            height: 720,
            alt: "Goosetriever showcase video",
            caption: "The showcase video from Hack the North 2026",
            youtube: "G8Z7QbDx5YE",
        },
        {
            src: "/media/goosetriever/goosetriever_mapping.jpg",
            width: 1280,
            height: 680,
            alt: "Lidar mapping the room",
            caption:
                "Lidar mapping the room live on the teleop page, at 4× speed",
            video: "/media/goosetriever/goosetriever_mapping.mp4",
        },
        {
            src: "/media/goosetriever/goosetriever_teleop_map.png",
            width: 1791,
            height: 953,
            alt: "Finished map on the teleop page",
            caption:
                "The finished map: inflated costmap, home marker and the routes driven",
        },
        {
            src: "/media/goosetriever/goosetriever_architecture.png",
            width: 1412,
            height: 1104,
            alt: "Goosetriever system architecture",
            caption:
                "A cloud LLM picks the skill; a QNX Pi sees, listens and holds the safety interlock; the nav Pi drives and the S100 runs the arm",
        },
        {
            src: "/media/goosetriever/goosetriever_astar.svg",
            width: 1000,
            height: 450,
            alt: "A* route planning",
            caption:
                "A* searches the inflated costmap and keeps clear of obstacles",
        },
        {
            src: "/media/goosetriever/goosetriever_testing.png",
            width: 242,
            height: 161,
            alt: "Testing the arm",
            caption: "Testing the arm's pickup and handoff on the robot",
        },
        {
            src: "/media/goosetriever/goosetriever_vision.png",
            width: 242,
            height: 161,
            alt: "Depth camera on the bench",
            caption: "D435i colour and depth streaming to the laptop",
        },
        {
            src: "/media/goosetriever/goosetriever_heartbeat.svg",
            width: 1000,
            height: 300,
            alt: "QNX safety heartbeat",
            caption:
                "The QNX interlock's heartbeat: any steady level, crash or cut wire reads as stop",
        },
    ],
    neurinese: [
        {
            src: "/media/neurinese/neurinese_2.png",
            width: 1600,
            height: 900,
            alt: "Style transfer across characters",
            caption:
                "Style pulled from one written character, applied to new ones",
        },
        {
            src: "/media/neurinese/neurinese_3.png",
            width: 1120,
            height: 1027,
            alt: "System diagram",
            caption:
                "System diagram — CNN recognizer, CVAE encoder, Markov next-char, decoder",
        },
        {
            src: "/media/neurinese/neurinese_1.gif",
            width: 757,
            height: 291,
            alt: "Generation demo",
            caption: "Neurinese drawing a character stroke by stroke",
        },
        {
            src: "/media/neurinese/neurinese_4.png",
            width: 1064,
            height: 1600,
            alt: "CVAE internals",
            caption:
                "CVAE internals — LSTM encoder/decoder and the teacher-forcing path",
        },
        {
            src: "/media/neurinese/neurinese_5.png",
            width: 1600,
            height: 591,
            alt: "Training curves",
            caption:
                "MSE mode collapse, then recovery once the decoder went MDN + CVAE",
        },
        {
            src: "/media/neurinese/neurinese_6.png",
            width: 1500,
            height: 1200,
            alt: "Style latent space",
            caption: "t-SNE of the 64-dim style latent, coloured by character",
        },
    ],
} satisfies Record<string, GalleryImage[]>;

// A project's gallery, checked when the site builds
export type GalleryTopic = keyof typeof GALLERIES;
