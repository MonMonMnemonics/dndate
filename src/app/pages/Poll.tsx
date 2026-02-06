import moment from "moment";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import type { UserData } from "@/common/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse, faPenToSquare, faPlus, faTrash, faUser } from "@fortawesome/free-solid-svg-icons";

export function Poll() {
    const { token } = useParams();
    const [ searchParams, _ ] = useSearchParams();

    const [ pollData, setPollData ] = useState({
        title: "POLL",
        description: "",
        dateStart: moment().format("YYYY-MM-DD"),
        dateEnd: moment().format("YYYY-MM-DD"),
        timezone: "GMT +00:00"
    })
    const [ dates, setDates ] = useState<string[]>([]);

    const [ userData, setUserData ] = useState<UserData[]>([]);
    const [ firstSetup, setFirstSetup ] = useState(false);

    useEffect(() => {
        getPollData();
    }, []);

    useEffect(() => {
        let start = moment(pollData.dateStart);
        const end = moment(pollData.dateEnd);

        let dateArray: string[] = [];
        while (!start.isAfter(end)) {
            dateArray.push(start.format("YYYY-MM-DD"));
            start = start.add(1, "d");
        }

        setDates(dateArray);
        
    }, [pollData.dateStart, pollData.dateEnd])

    async function getPollData() {
        const res = await fetch("/api/poll/data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token: token,
                ott: searchParams.get("ott") ?? ""
            })
        })

        if (res.status != 200) {
            Swal.fire({
                title: "Server Error",
                icon: "error",
                text: "sorry for the inconvenience, please let admin know."
            });
        }

        const data = await res.json();
        setPollData({...pollData, ...data.pollData});
        setFirstSetup(data.firstSetup);
        setUserData(data.userData);
    }

    return (
        <div className="flex flex-col w-screen h-screen p-3 gap-3">
            <div className="bg-dark-secondary rounded-lg p-3 border border-gray-500 text-dark-text flex flex-col gap-2 h-[30%]">
                <div className="flex flex-row">
                    <button className="dark-button p-1 text-2xl rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center"
                        onClick={() => {window.location.href = "/"}} type="button"
                    >
                        <FontAwesomeIcon icon={faHouse} />
                        <div className="font-bold">Back</div>
                    </button>
                    <div className="grow h-full flex flex-col">
                        <div className="my-auto text-center font-bold text-3xl">
                            {pollData.title}
                        </div>
                    </div>
                </div>
                <hr className="h-px my-2 bg-white border-0"/>
                <div className="grow flex flex-row gap-2">
                    <div className="h-full w-[20em] flex flex-col gap-2">
                        <div className="flex flex-row justify-between items-center">
                            <div className="font-bold text-xl">Members</div>
                            <button className="bg-green-600 px-3 py-1 rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center"
                                onClick={() => {}} type="button"
                            >
                                <div className="font-bold">Let me join!</div>
                                <FontAwesomeIcon icon={faPlus} />
                            </button>
                        </div>
                        <div className="grow relative flex flex-col">
                            <div className="h-full w-full absolute gap-2 overflow-y-auto px-2">
                                <ul className="list-none font-bold">
                                    {
                                        userData.map((user, idx) => (
                                            <li key={'user-list-' + idx}><div className="flex flex-row gap-2 items-center">
                                                <FontAwesomeIcon icon={faUser}/>
                                                <div className="w-full">{user.name + (user.host ? " (host)" : "")} </div>
                                                <FontAwesomeIcon className="cursor-pointer" icon={faPenToSquare}/>
                                                <FontAwesomeIcon className="cursor-pointer text-red-500" icon={faTrash}/>
                                            </div></li>
                                        ))
                                    }
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="w-px mx-2 bg-white border-0"/>
                    <div className="grow flex flex-col gap-2">
                        <textarea
                            value={pollData.description}
                            placeholder="Description of the poll is here... If only the host provided one..."
                            className="transparent-input w-full p-2 rounded border font-light resize-none h-[10em] h-full"
                            readOnly={true}
                        />
                        <div className="flex flex-row justify-between items-center font-bold text-xl">
                            <div>Timezone: {pollData.timezone}</div>
                            <div className="flex flex-row items-center gap-2">
                                <div>Preferred</div>
                                <div>Open</div>
                                <div>No</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-dark-secondary rounded-lg p-3 border border-gray-500 text-dark-text flex flex-col gap-2 grow">
                <div className='relative grow select-none flex flex-col'>
                    <div className="h-full w-full absolute overflow-auto p-2">
                        <table className='poll table-auto' style={{ width: 'auto' }}>
                            <thead className="sticky top-0">
                                <tr>
                                    <th rowSpan={2} className='sticky left-0 align-middle text-center' style={{ zIndex: 2 }}>Name</th>
                                    { dates.map(date => (
                                        <th key={'header-' + date} colSpan={48}>{moment(date).format('YYYY-MM-DD (dddd)')}</th>
                                    ))}
                                </tr>
                                <tr>
                                    { dates.map((date) => {
                                        return Array.from(Array(24*2).keys()).map((timeslotIdx) => (
                                            <th key={date + "-" + timeslotIdx}>{((timeslotIdx % 2) == 0) ? timeslotIdx/2 : ""}</th>
                                        ))
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {userData.map((user, idx) => (
                                    <tr key={'tr-' + idx} style={{ height: '3em' }}>
                                        <th className='sticky text-nowrap left-0 align-middle px-3' style={{ zIndex: 1 }}>
                                            <div className='flex flex-row items-center gap-3 w-full'>
                                                <div>{user.name}</div>
                                            </div>
                                        </th>
                                        {/*dates.map((date) => {
                                            return Array.from(Array(24*2).keys()).map((idx2) => {
                                                return (
                                                    <td key={idx + "-" + date + '-' + idx2} className='bg-light'></td>
                                                );
                                            })
                                        })*/}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Poll;