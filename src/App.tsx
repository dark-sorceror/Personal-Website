import Home from "./Home";

import Linkbar from "./components/Linkbar";
import Navbar from "./components/Navbar";
import StarBackground from "./components/StarBackground";

import "./App.css";
import BTT from "./components/BTT";

function App() {
    return (
        <>
            <StarBackground />
            <Navbar />
            <Linkbar />
            <Home />
            <BTT />
        </>
    );
}

export default App;
