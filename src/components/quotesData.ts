export type Quote = {
    text: string;
    author: string;
};

// Attributions follow the earliest traceable source rather than the name
// the internet usually pins on a line. Several of these circulate under
// famous names (Shaw, Jay Shetty) with nothing behind them; those stay
// Unknown.
export const QUOTES: Quote[] = [
    {
        text: "How you do anything is how you do everything.",
        author: "Zen proverb",
    },
    {
        text: "Sacrifice for what you want, or what you want becomes the sacrifice.",
        author: "Unknown",
    },
    {
        text: "The real you is who you are when ain’t nobody watching.",
        author: "Unknown",
    },
    {
        // From the back cover of the last Whole Earth Catalog (1974),
        // which Jobs quoted at Stanford in 2005
        text: "Stay hungry. Stay foolish.",
        author: "Steve Jobs",
    },
    {
        text: "In life, two things define you: your patience when you have nothing, and your attitude when you have everything.",
        author: "Unknown",
    },
    {
        text: "If all your hopes and dreams came true, you wouldn’t have anything to look forward to.",
        author: "Unknown",
    },
    {
        // Adapted from the tree-planting proverb, which Quote Investigator
        // traces to an anonymous 1967 remark, not to China
        text: "The best time to start was yesterday. The second best time is today.",
        author: "Proverb",
    },
    {
        text: "The best way to predict the future is to invent it.",
        author: "Alan Kay",
    },
    {
        text: "Talk is cheap. Show me the code.",
        author: "Linus Torvalds",
    },
];
