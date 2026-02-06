import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboardList } from "@fortawesome/free-solid-svg-icons";

export function HomePage() {
  return (
    <div className="homepage w-screen h-screen">
        <div className="bg-dark-secondary rounded-lg p-8 border border-dark-border text-dark-text flex flex-col gap-2">
            <div className="text-center text-7xl align-middle grow mb-3 font-bold">DNDate</div>
            <h1 className="w-full text-center">For when you want to dnd but just can't agree on a date</h1>
            <h1 className="w-full text-center">Inspired by <a href="https://tonton.amaneku.com/" target="_blank" className="font-medium text-fg-brand underline hover:no-underline">Tonton Amaneku</a></h1>
            <hr className="h-px my-2 bg-white border-0"/>
            <div className="flex flex-row justify-center">
                <button className="dark-button p-3 text-2xl rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center"
                    onClick={() => {window.location.href = "create-poll"}}
                >
                    <FontAwesomeIcon icon={faClipboardList} />
                    <div className="font-bold">Make a poll</div>
                </button>
            </div>
        </div>
    </div>
  );
}

export default HomePage;
