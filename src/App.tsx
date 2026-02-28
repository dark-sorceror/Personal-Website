import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { useScrollToTop } from "./hook/scrollToTop";
import { useVisitorLog } from "./hook/log";
import { usePageTracking } from "./hook/page";

import { Navbar } from "./components/Navbar";

import { Home } from "./Home";
import { Experience } from "./Experience";
import { Projects } from "./Projects";
import { Contact } from "./Contact";

function Wrapper() {
    useScrollToTop();
    usePageTracking();

    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/experience" element={<Experience />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={"error"} />
        </Routes>
    );
}

function App() {
    useVisitorLog();

    return (
        <Router>
            <Navbar />
            <Wrapper />
        </Router>
    );
}

export default App;
