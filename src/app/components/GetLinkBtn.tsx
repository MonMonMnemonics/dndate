import { faCheckCircle, faLink, faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Fragment, useState } from "react"

export const GetLinkBtn = ({token}: {token: string}) => {
    const [ copied, setCopied ] = useState(false);

    async function copyShareLink() {
        await navigator.clipboard.writeText(window.location.origin + "/poll/" + token);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 3000);
    }

    return(
        <button className={"px-3 py-1 rounded border flex items-center justify-center gap-2 font-bold flex flex-row gap-2 items-center w-[12em]" 
            + (copied ? " bg-green-600" : " bg-blue-600")
        }
            onClick={copyShareLink}
        >
            {
                copied ?
                <Fragment>
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <div className="font-bold">Copied</div>
                </Fragment>
                :
                <Fragment>
                    <FontAwesomeIcon icon={faLink}/>
                    <div className="font-bold">Copy share link</div>
                </Fragment>
            }
        </button>
    )
}