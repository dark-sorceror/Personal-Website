import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./Home";
import Experience from "./Experience";

import Navbar from "./components/Navbar";

function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/experience" element={<Experience />} />
                <Route path="*" element={"error"} />
            </Routes>
        </Router>
    );
}

export default App;
