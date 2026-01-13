import LatentField from "./components/Orbit";

export default function Home() {
    return (
        <div className="wrapper">
            <section className="s1 s">
                <div className="s1-content s-c">
                    <div className="head">
                        <div className="name">
                            <div className="pre">
                                Hi, my name is
                                <br />
                                <span className="n">Hao Yan</span>
                                <br />
                                <br />
                                <span className="desc">
                                    Building intelligent systems with AI &
                                    Robotics.
                                </span>
                            </div>
                        </div>
                        <LatentField />
                    </div>

                    <a
                        className="headline bubble"
                        href="https://github.com/dark-sorceror/Neurinese"
                        target="_blank"
                    >
                        Check out my latest project: Neurinese
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            id="Layer_1"
                            viewBox="0 0 24 24"
                            data-name="Layer 1"
                        >
                            <defs>
                                <linearGradient
                                    id="p3-gradient"
                                    x1="0%"
                                    y1="0%"
                                    x2="100%"
                                    y2="100%"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="color(display-p3 0.6196 0.4784 1 / 1)"
                                    />
                                    <stop
                                        offset="33.33%"
                                        stopColor="color(display-p3 0.9961 0.5451 0.7333 / 1)"
                                    />
                                    <stop
                                        offset="66.67%"
                                        stopColor="color(display-p3 1 0.7412 0.4784 / 1)"
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="color(display-p3 0.9725 0.9176 0.7647 / 1)"
                                    />
                                </linearGradient>
                            </defs>
                            <path
                                fill="white"
                                stroke="url(#p3-gradient)"
                                d="m22.937 14.059c-.22 3.749-.93 7.019-.96 7.156-.083.381-.381.679-.762.762-.19.042-4.713 1.023-9.214 1.023s-9.024-.981-9.214-1.023c-.381-.083-.679-.381-.762-.762-.042-.19-1.023-4.713-1.023-9.214s.979-9.025 1.021-9.215c.083-.381.381-.679.762-.762.137-.03 3.407-.741 7.156-.96.563-.04 1.025.389 1.057.939.033.551-.388 1.024-.939 1.057-2.644.155-5.092.577-6.209.79-.265 1.386-.849 4.824-.849 8.151s.584 6.765.849 8.151c1.386.265 4.824.849 8.151.849s6.765-.584 8.151-.849c.213-1.117.635-3.566.79-6.209.032-.552.5-.988 1.057-.939.551.032.972.505.939 1.057zm-8.732-10.674c1.786-.375 3.555-.461 5.285-.289l-10.197 10.197c-.391.391-.391 1.023 0 1.414.195.195.451.293.707.293s.512-.098.707-.293l10.197-10.197c.172 1.73.085 3.499-.289 5.285-.113.541.233 1.071.774 1.184.527.113 1.073-.23 1.184-.774.569-2.721.568-5.417-.002-8.014-.083-.381-.381-.678-.762-.762-2.597-.571-5.292-.572-8.014-.002-.541.113-.887.643-.774 1.184.114.54.641.884 1.184.774z"
                            />
                        </svg>
                    </a>
                    <div className="down">
                        Check out my experiences
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            id="Outline"
                            viewBox="0 0 24 24"
                            width="15"
                            height="15"
                        >
                            <defs>
                                <linearGradient
                                    id="p3-gradient"
                                    x1="0%"
                                    y1="0%"
                                    x2="100%"
                                    y2="100%"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="color(display-p3 0.6196 0.4784 1 / 1)"
                                    />
                                    <stop
                                        offset="33.33%"
                                        stopColor="color(display-p3 0.9961 0.5451 0.7333 / 1)"
                                    />
                                    <stop
                                        offset="66.67%"
                                        stopColor="color(display-p3 1 0.7412 0.4784 / 1)"
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="color(display-p3 0.9725 0.9176 0.7647 / 1)"
                                    />
                                </linearGradient>
                            </defs>
                            <path
                                stroke-width="2"
                                fill="none"
                                stroke="url(#p3-gradient)"
                                d="M18.71,8.21a1,1,0,0,0-1.42,0l-4.58,4.58a1,1,0,0,1-1.42,0L6.71,8.21a1,1,0,0,0-1.42,0,1,1,0,0,0,0,1.41l4.59,4.59a3,3,0,0,0,4.24,0l4.59-4.59A1,1,0,0,0,18.71,8.21Z"
                            />
                        </svg>
                    </div>
                </div>
            </section>
            <section className="s2 s"></section>
            <section className="s3 s"></section>
            <section className="s4 s">
                <div className="s4-content s-c">
                    <div className="s4-head">
                        <span className="title">Chat With Me</span>

                        <span className="desc">
                            Get to know more of me just by asking me here!
                        </span>
                    </div>
                    <div className="chat-wrapper">
                        <div className="chat">s</div>
                        <div className="chat-area r">
                            <textarea
                                id="chat-box"
                                className="chat-box"
                                placeholder="Ask anything..."
                                rows={1}
                            />
                            <button className="send-button">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    id="Outline"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M18,15.5a1,1,0,0,1-.71-.29l-4.58-4.59a1,1,0,0,0-1.42,0L6.71,15.21a1,1,0,0,1-1.42-1.42L9.88,9.21a3.06,3.06,0,0,1,4.24,0l4.59,4.58a1,1,0,0,1,0,1.42A1,1,0,0,1,18,15.5Z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
