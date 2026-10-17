import { BOOKS } from "@/components/bookshelfData";
import styles from "./Bookshelf.module.css";

export function Bookshelf() {
    return (
        // A named region for screen readers. The row fits on every screen,
        // so it isn't a tab stop; if it ever overflows, browsers make the
        // scroller focusable on their own.
        <div
            className={styles.scroller}
            role="region"
            aria-label="On the shelf"
        >
            <ul className={styles.shelf}>
                {BOOKS.map((book) => (
                    <li key={book.cover} className={styles.book}>
                        {/* The title is printed right below, so the cover is decorative */}
                        <img
                            src={book.cover}
                            alt=""
                            width={book.width}
                            height={book.height}
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
