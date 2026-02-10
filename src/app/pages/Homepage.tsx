import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboardList } from "@fortawesome/free-solid-svg-icons";
import { Fragment, useEffect, useState } from "react";
import homepagepict from "../../../static/Homepage.png";

export function HomePage() {
    const [ recentPolls, setRecentPolls ] = useState<{token: string, title: string}[]>([]);

    useEffect(() => {
        let newRecentPolls: any = window.localStorage.getItem("recent-polls");
        if (!newRecentPolls) {
            newRecentPolls = [];
        } else {
            try {
                newRecentPolls = JSON.parse(newRecentPolls);
            } catch (error) {
                newRecentPolls = [];
            }

            if (!Array.isArray(newRecentPolls)) {
                newRecentPolls = [];
            }
        }

        setRecentPolls(newRecentPolls);
    }, []);

    return (
        <div className="homepage w-screen h-screen">
            <div className="bg-dark-secondary rounded-lg p-8 border border-dark-border text-dark-text flex flex-row gap-2">
                <div className="flex flex-col">
                    <img src={homepagepict} className="h-[60vh] my-auto" />
                </div>                
                <div className="w-px mx-2 bg-white border-0"/>
                <div className="flex flex-col gap-2">
                    <div className="text-center text-7xl align-middle grow mb-3 font-bold">DNDate</div>
                    <h1 className="w-full text-center">For when you want to dnd but just can't agree on a date</h1>
                    <h1 className="w-full text-center">Inspired by <a href="https://tonton.amaneku.com/" target="_blank" className="font-medium text-fg-brand underline hover:no-underline">Tonton Amaneku</a></h1>
                    <div className="flex flex-row justify-center">
                        <button className="dark-button p-3 text-2xl rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center"
                            onClick={() => {window.location.href = "create-poll"}}
                        >
                            <FontAwesomeIcon icon={faClipboardList} />
                            <div className="font-bold">Make a poll</div>
                        </button>
                    </div>
                    {
                        (recentPolls.length > 0) ?
                        <Fragment>
                            <hr className="h-px my-2 bg-white border-0"/>
                            <div className="w-full font-bold text-xl">Recent Polls</div>
                            <ul className="list-disc ps-5">
                                {
                                    recentPolls.map((poll, idx) => (
                                        <li key={"rec-poll-" + idx}><a className="underline text-blue-300" href={"poll/" + poll.token}>{poll.title}</a></li>
                                    ))
                                }
                            </ul>
                        </Fragment>
                        : null
                    }
                    <div className="h-full"></div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
