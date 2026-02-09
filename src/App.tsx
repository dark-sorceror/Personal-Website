import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { useScrollToTop } from "./hook/scrollToTop";

import { Navbar } from "./components/Navbar";

import { Home } from "./Home";
import Experience from "./Experience";

function Wrapper() {
    useScrollToTop();

    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/experience" element={<Experience />} />
            <Route path="*" element={"error"} />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <Navbar />
            <Wrapper />
        </Router>
    );
}

export default App;
