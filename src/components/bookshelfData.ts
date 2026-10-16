export type Book = {
    title: string;
    author: string;
    cover: string;
};

// Ordered bottom-up through the stack: the OS, the network, the distributed
// systems on top of both, then the language. Covers live in /media/books.
export const BOOKS: Book[] = [
    {
        title: "Operating Systems: Three Easy Pieces",
        author: "the Arpaci\u2011Dusseaus",
        cover: "/media/books/operating-systems-three-easy-pieces.jpg",
    },
    {
        title: "TCP/IP Illustrated, Vol.\u00a01",
        author: "Kevin R. Fall & W. Richard Stevens",
        cover: "/media/books/tcp-ip-illustrated-vol1.jpg",
    },
    {
        title: "Designing Data-Intensive Applications",
        author: "Martin Kleppmann",
        cover: "/media/books/designing-data-intensive-applications.jpg",
    },
    {
        title: "A Tour of C++",
        author: "Bjarne Stroustrup",
        cover: "/media/books/a-tour-of-cpp-3e.jpg",
    },
];
