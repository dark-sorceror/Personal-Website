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
    lumen: [
        {
            src: "/media/projects/lumen/architecture.svg",
            width: 1200,
            height: 700,
            alt: "Lumen decode-loop architecture",
            caption:
                "A hand-rolled MLX decode loop you can inspect between tokens",
        },
        {
            src: "/media/projects/lumen/edit-and-continue.svg",
            width: 1200,
            height: 700,
            alt: "Edit-and-continue workflow",
            caption:
                "Edit the context and keep going, re-prefilling only the changed suffix",
        },
    ],
    goosetriever: [
        {
            src: "/media/projects/goosetriever/robot.jpg",
            width: 806,
            height: 537,
            alt: "Wheeled robot with a white SO-101 arm and cardboard wings",
            caption:
                "Winner of Best use of Huawei's Real-Time Multimodal AI at Hack the North 2026",
        },
        {
            src: "/media/projects/goosetriever/showcase.jpg",
            width: 1280,
            height: 720,
            alt: "Goosetriever showcase video",
            caption: "The showcase video from Hack the North 2026",
            youtube: "G8Z7QbDx5YE",
        },
        {
            src: "/media/projects/goosetriever/mapping.jpg",
            width: 1280,
            height: 680,
            alt: "Room map filling in on the teleop page",
            caption:
                "Lidar mapping the room live on the teleop page, at 4× speed",
            video: "/media/projects/goosetriever/mapping.mp4",
        },
        {
            src: "/media/projects/goosetriever/teleop-map.png",
            width: 1791,
            height: 953,
            alt: "Finished map on the teleop page",
            caption: "The finished costmap and the routes the robot drove",
        },
        {
            src: "/media/projects/goosetriever/architecture.png",
            width: 1412,
            height: 1104,
            alt: "Goosetriever system architecture",
            caption:
                "A cloud LLM picks the skill and a QNX Pi holds the safety interlock",
        },
        {
            src: "/media/projects/goosetriever/a-star.svg",
            width: 1000,
            height: 450,
            alt: "A* route planning",
            caption:
                "A* searches the inflated costmap and keeps clear of obstacles",
        },
        {
            src: "/media/projects/goosetriever/arm-test.jpg",
            width: 806,
            height: 537,
            alt: "The robot's arm reaching up, with someone seated beside it",
            caption: "Testing the arm's pickup and handoff on the robot",
        },
        {
            src: "/media/projects/goosetriever/depth-camera.jpg",
            width: 806,
            height: 538,
            alt: "Laptop showing the depth feed beside the robot",
            caption: "D435i colour and depth streaming to the laptop",
        },
        {
            src: "/media/projects/goosetriever/heartbeat.svg",
            width: 1000,
            height: 300,
            alt: "QNX safety heartbeat",
            caption:
                "A flat QNX heartbeat reads as stop, whether from a crash or a cut wire",
        },
    ],
    neurinese: [
        {
            src: "/media/projects/neurinese/style-transfer.png",
            width: 1600,
            height: 900,
            alt: "Style transfer across characters",
            caption:
                "Style pulled from one written character, applied to new ones",
        },
        {
            src: "/media/projects/neurinese/architecture.png",
            width: 1120,
            height: 1027,
            alt: "System diagram",
            caption:
                "A Markov chain picks the next character and the CVAE draws it in your style",
        },
        {
            src: "/media/projects/neurinese/generation.gif",
            width: 757,
            height: 291,
            alt: "Generation demo",
            caption: "Neurinese drawing a character stroke by stroke",
        },
        {
            src: "/media/projects/neurinese/cvae.png",
            width: 1064,
            height: 1600,
            alt: "CVAE internals",
            caption:
                "The CVAE's LSTM encoder and decoder, trained with teacher forcing",
        },
        {
            src: "/media/projects/neurinese/training-curves.png",
            width: 1600,
            height: 591,
            alt: "Training curves",
            caption:
                "MSE mode collapse, then recovery once the decoder went MDN + CVAE",
        },
        {
            src: "/media/projects/neurinese/style-latent.png",
            width: 1500,
            height: 1200,
            alt: "Style latent space",
            caption: "t-SNE of the 64-dim style latent, coloured by character",
        },
    ],
} satisfies Record<string, GalleryImage[]>;

// A project's gallery, checked when the site builds
export type GalleryTopic = keyof typeof GALLERIES;
