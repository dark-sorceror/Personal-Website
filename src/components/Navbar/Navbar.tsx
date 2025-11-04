import "./Navbar.css";

export default function Navbar() {
    return (
        <nav>
            <div className="nav">
                <div className="logo"></div>
                <div className="hotlinks">
                    <a href="" className="about-me">
                        About Me
                    </a>
                    <a href="" className="experience">
                        Experience
                    </a>
                </div>
            </div>
        </nav>
    );
}