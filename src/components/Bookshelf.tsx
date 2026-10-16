import { BOOKS } from "@/components/bookshelfData";
import styles from "./Bookshelf.module.css";

export function Bookshelf() {
    return (
        // Focusable so keyboard users can scroll the shelf with the arrow keys
        <div className={styles.scroller} tabIndex={0} aria-label="Bookshelf">
            <ul className={styles.shelf}>
                {BOOKS.map((book) => (
                    <li key={book.cover} className={styles.book}>
                        {/* The title is printed right below, so the cover is decorative */}
                        <img
                            src={book.cover}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className={styles.cover}
                        />
                        <cite className={styles.title}>{book.title}</cite>
                        <span className={styles.author}>{book.author}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
