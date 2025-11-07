export default function Home() {
    return (
        <div className="wrapper">
            <section className="p1">
                <div className="p1w">
                    <div className="top">Hi, my name is</div>
                    <div className="name">Hao Yan.</div>
                    <div className="tagline">
                        Bridging intelligence and autonomy.
                    </div>
                    <div className="desc">
                        A university student interested in AI/ML and robotics
                    </div>
                </div>
                <div className="background-dots">
                    <div></div>
                </div>
            </section>
            <section className="p2">
                <div className="p2w">
                    <div className="p2header">Experiences</div>
                    <div className="design"></div>
                    <div className="p2e1">
                        <div className="details">
                            <div className="title">Title</div>
                            <div className="p2edesc">Desc</div>
                        </div>
                        <div className="placeholder"></div>
                    </div>
                    <div className="p2e2">
                        <div className="placeholder"></div>
                        <div className="details">
                            <div className="title">Title</div>
                            <div className="p2edesc">Desc</div>
                        </div>
                    </div>
                    <div className="p2e3">
                        <div className="details">
                            <div className="title">Title</div>
                            <div className="p2edesc">Desc</div>
                        </div>
                        <div className="placeholder"></div>
                    </div>
                </div>
            </section>
            <section className="p3">
                <div className="p3w">
                    <div className="p3header">Let's get in touch</div>
                    <div className="p3a">
                        <input type="text" />
                        <button>ok</button>
                    </div>
                </div>
            </section>
        </div>
    );
}
