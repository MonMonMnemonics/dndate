import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowCircleLeft, faSpinner, faWandSparkles } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import moment from "moment";
import Swal from 'sweetalert2';

const extraOpts: {[index: string]: any} = {
    "first-timer": { text:"If first-timer player", codes: ["first-timer"]},
    "help-char-create": { text:"If player needs guidance creating their char", codes: ["help-char-create"]},
    "discord-handle": { text:"Discord handle username", codes: ["discord-handle"]},
    "veils-lines": { text:"Veils (Uncomfortable subjects) and Lines (PTSD-inducing subjects)" , codes: ["veils", "lines"]},
};

const timezones: string[] = [
    "GMT -12:00",
    "GMT -11:00",
    "GMT -10:00",
    "GMT -09:30",
    "GMT -09:00",
    "GMT -08:00",
    "GMT -07:00",
    "GMT -06:00",
    "GMT -05:00",
    "GMT -04:30",
    "GMT -04:00",
    "GMT -03:30",
    "GMT -03:00",
    "GMT -02:00",
    "GMT -01:00",
    "GMT +00:00",
    "GMT +01:00",
    "GMT +02:00",
    "GMT +03:00",
    "GMT +04:00",
    "GMT +04:30",
    "GMT +05:00",
    "GMT +05:30",
    "GMT +06:00",
    "GMT +06:30",
    "GMT +07:00 (WIB)",
    "GMT +08:00 (WITA)",
    "GMT +08:30",
    "GMT +09:00 (WIT)",
    "GMT +09:30",
    "GMT +10:00",
    "GMT +11:00",
    "GMT +12:00",
]

export function CreatePoll() {
    const [ name, setName ] = useState("");
    const [ pass, setPass ] = useState("");
    const [ title, setTitle ] = useState("");
    const [ desc, setDesc ] = useState("");
    const [ dateStart, setDateStart ] = useState(moment().format('YYYY-MM-DD'));
    const [ dateEnd, setDateEnd ] = useState(moment().add(7, "d").format('YYYY-MM-DD'));
    const [ optsInfo, setOptInfo ]  = useState<string[]>([]);
    const [ loading, setLoading] = useState(false);
    const [ timezone, setTimezone ] = useState(timezones[25])

    async function createPoll() {
        const swConf = await Swal.fire({
            title: "Create poll?",
            icon: "question",
            theme: "dark",
            showCancelButton: true,
            focusConfirm: false,
            reverseButtons: true,
            confirmButtonText: "Yes",
            cancelButtonText: "No"
        })
        
        if (!swConf.isConfirmed) {
            return;
        }

        setLoading(true);        
        const res = await fetch("/api/poll/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name,
                pass,
                title,
                desc,
                dateStart,
                dateEnd,
                timezone,
                opts: optsInfo.map(key => {
                    if (key in extraOpts) {
                        return extraOpts[key].codes;
                    } else {
                        return([])
                    }
                }).flat()
            })
        })

        if (res.status == 200) {
            const data = await res.json();
            window.sessionStorage.setItem("OTT-" + data.token, data.ott);
            if (("ott" in data) && ("token" in data)) {
                window.location.href = "/poll/" + data.token;
                return;
            }
        } 

        setLoading(false);
        Swal.fire({
            title: "Server Error",
            theme: 'dark',
            icon: "error",
            text: "sorry for the inconvenience, please let admin know."
        });
    }

    return (
        <div className="flex flex-row justify-center w-screen h-screen">
            { loading && 
                <div className="fixed h-full w-full z-10 flex flex-row">
                    <div className="bg-black opacity-40 fixed h-full w-full z-11"></div>
                    <div className="mx-auto flex flex-col">
                        <div className="my-auto rounded-lg p-8 border border-black bg-dark-secondary z-12 flex flex-col font-bold text-3xl gap-5">
                            <div className="w-full flex flex-row justify-center">
                                <FontAwesomeIcon className="text-[10em] animate-spin" icon={faSpinner} />
                            </div>
                            <div className="w-full text-center">LOADING...</div>
                        </div>
                    </div>
                </div>
            }
            <div className="h-full flex flex-col p-4">
                <form className="bg-dark-secondary rounded-lg p-8 border border-dark-border text-dark-text flex flex-col gap-3 w-[60vw] min-w-[600px]">
                    <div className="flex flex-row justify-between items-end">
                        <button className="dark-button p-1 text-xl rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center"
                            onClick={() => {window.location.href = "/"}} type="button"
                        >
                            <FontAwesomeIcon icon={faArrowCircleLeft} />
                            <div className="font-bold">Back</div>
                        </button>
                        <div className="font-bold text-2xl">Create a poll</div>
                    </div>
                    <hr className="h-px my-2 bg-white border-0"/>
                    <div className="flex flex-row gap-1">
                        <div className="flex flex-row gap-2 items-center w-full">
                            <div className="text-nowrap text-xl">Host name:</div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Host name..."
                                className="dark-input w-full p-2 rounded border font-light"
                                maxLength={20}
                                required
                            />
                        </div>
                        <div className="flex flex-row gap-2 items-center w-full">
                            <div className="text-nowrap text-xl">Host password:</div>
                            <input
                                type="password"
                                value={pass}
                                onChange={(e) => setPass(e.target.value)}
                                placeholder="password"
                                className="dark-input w-full p-2 rounded border font-light"
                                maxLength={40}
                                required
                            />
                        </div>
                    </div>
                    <hr className="h-px my-2 bg-gray-600 border-0"/>
                    <div className="flex flex-row gap-2 items-center w-full">
                        <div className="text-nowrap text-xl">Poll title:</div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Poll title..."
                            className="dark-input w-full p-2 rounded border font-light"
                            maxLength={40}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                        <div className="text-nowrap text-xl">Description:</div>
                        <textarea
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            placeholder="Description what kind of event is this (optional)"
                            className="dark-input w-full p-2 rounded border font-light resize-none h-[10em]"
                            maxLength={2000}
                        />
                    </div>
                    <div className="flex flex-row gap-2 items-center text-xl">
                        <div className="text-nowrap">Open date:</div>
                        <input value={dateStart} type="date" min={moment().format('YYYY-MM-DD')} max={moment().add(6, "M").format('YYYY-MM-DD')} className="font-bold" 
                            onChange={(e) => {
                                if (e.target.value != "") {
                                    setDateStart(e.target.value);
                                    if (moment(e.target.value).isAfter(moment(dateEnd))) {
                                        setDateEnd(e.target.value);
                                    }
                                }
                            }}/>
                        <div className="text-nowrap">-</div>
                        <input value={dateEnd} type="date" min={dateStart} max={moment().add(6, "M").format('YYYY-MM-DD')} className="font-bold"
                            onChange={(e) => {
                                if (e.target.value != "") {
                                    setDateEnd(e.target.value);
                                }                                
                            }}/>

                        <div className="text-nowrap text-sm">(6 months in advance max)</div>
                    </div>
                    <div className="flex flex-row gap-2 items-center w-full">
                        <div className="text-nowrap text-xl">Timezone:</div>
                        <select 
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="font-bold text-xl px-2"
                        >
                            {timezones.map((tz, idx) => <option key={"opt-" + idx} value={tz}>{tz}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                        <div className="text-nowrap text-xl">Extra opts:</div>
                        <ul className="list-none">
                            {Object.entries(extraOpts).map(([key, opt]) => (
                                <li className="flex flex-row gap-2 items-center" key={"opts-" + key}>
                                    <input className="w-[1.1em] h-[1.1em]" type="checkbox" checked={optsInfo.includes(key)}
                                        onChange={() => {
                                            const idx = optsInfo.indexOf(key);
                                            if (idx == -1) {
                                                setOptInfo([...optsInfo, key]);
                                            } else {
                                                setOptInfo(optsInfo.filter(e => (e !== key)));
                                            }
                                        }}
                                    />
                                    <div>{opt.text}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <button className="dark-button p-1 py-3 text-xl rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center"
                        type="submit"
                        onClick={(e) => {
                            if ((name !== "") && (pass !== "" ) && (title !== "")) {
                                e.preventDefault();
                                createPoll();
                            }
                        }}
                    >
                        <FontAwesomeIcon icon={faWandSparkles} />
                        <div className="font-bold">CREATE POLL</div>
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreatePoll;
