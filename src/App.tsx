import Home from "./Home";

import Linkbar from "./components/Linkbar/Linkbar";
import Navbar from "./components/Navbar/Navbar";
import StarBackground from "./components/StarBackground";

import "./App.css";

function App() {
    return (
        <>
            <StarBackground />
            <Navbar />
            <Linkbar />
            <Home />
        </>
    );
}

export default App;
