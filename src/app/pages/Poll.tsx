import moment from "moment";
import { Fragment, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import type { UserData } from "@/common/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faHouse, faPenToSquare, faPlus, faQuestionCircle, faSpinner, faTrash, faUser } from "@fortawesome/free-solid-svg-icons";

export function Poll() {
    const { token } = useParams();
    const [ pollExist, setPollExist ] = useState(true);

    const [ pollData, setPollData ] = useState({
        title: "POLL",
        description: "",
        dateStart: moment().format("YYYY-MM-DD"),
        dateEnd: moment().format("YYYY-MM-DD"),
        timezone: "GMT +00:00"
    })
    const [ dates, setDates ] = useState<string[]>([]);
    const [ userData, setUserData ] = useState<UserData[]>([]);

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
                ott: (window.sessionStorage.getItem("OTT-" + token) ?? "")
            })
        })

        if (res.status == 418) {
            setPollExist(false);
            return;
        }

        if (res.status != 200) {
            Swal.fire({
                title: "Server Error",
                icon: "error",
                text: "sorry for the inconvenience, please let admin know."
            });
        }

        const data = await res.json();
        setPollData({...pollData, ...data.pollData});
        setUserData(data.userData);

        if ((data.firstSetup ?? false) == true) {
            for (const usr of (data.userData ?? [])) {
                if (usr.host == true) {
                    setSelectedUser({
                        id: usr.id,
                        host: false,
                        auth: "OTT",
                        key: (window.sessionStorage.getItem("OTT-" + token) ?? "")
                    });
                    break;
                }
            }
        }
    }

    //-------------------------- TABLE EDIT CONTROL --------------------------
    const [ selectedUser, setSelectedUser] = useState({
        id: -1,
        host: false,
        auth: "OTT",
        key: ""
    });

    const [ brushType, setBrushType ] = useState(1);
    const [ brushActive, setBrushActive ] = useState(false);
    const [ loading, setLoading ] = useState(false);
    const [ failCheck, setFailCheck ] = useState(0);
    const [ hostClosed, setHostClosed ] = useState<string[]>([]);

    useEffect(() => {
        let newHostClosed : string[] = [];
        for (const user of userData) {
            if (user.host) {
                for (const dateKey in user.attendance) {
                    if (!user.attendance[dateKey]) {
                        newHostClosed.push(dateKey);
                    }
                }
            }
        }

        setHostClosed([...new Set(newHostClosed)]);
    }, [userData]);

    function switchCellColour(date: string, timeslotIdx: number) {
        if (selectedUser.id != -1) {
            setUserData(userData.map(usr => {
                if (usr.id === selectedUser.id) {
                    const dateKey = date + "-" + timeslotIdx.toString();
                    if (brushType == -1) {
                        usr.attendance[dateKey] = false;
                    } else if (brushType == 0) {
                        delete usr.attendance[dateKey];
                    } else if (brushType == 1) {
                        usr.attendance[dateKey] = true;
                    }
                }
                return (usr);
            }));
        }
    }

    function mouseDown(date: string, timeslotIdx: number) {
        setBrushActive(true);
        switchCellColour(date, timeslotIdx);
    }

    function mouseEnter(date: string, timeslotIdx: number) {
        if (brushActive) {
            switchCellColour(date, timeslotIdx);
        }
    }

    function mouseLeave() {
        setBrushActive(false);
    }

    async function login(userName: string, userId: number) {
        const swConf = await Swal.fire({
            title: "Login",
            input: "password",
            inputPlaceholder: "password...",
            inputLabel: "Password",
            inputAttributes: {
                autocapitalize: "off",
                autocorrect: "off"
            },
            text: "Login password for username " + userName,
            showCancelButton: true,
            focusConfirm: false,
            reverseButtons: true,
            confirmButtonText: "Login",
            cancelButtonText: "Cancel",
            inputValidator: (val) => {
                if (!val) {
                    return "Please fill in password";
                }
            }
        })

        if (!swConf.isConfirmed) {
            return;
        }

        if (failCheck >= 3) {
            Swal.fire({
                title: "Login fail",
                icon: "error",
                text: "Make sure you choose the right user and enter the right password"
            });
        }

        setLoading(true);
        const res = await fetch("/api/poll/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token: token,
                userId: userId,
                pass: swConf.value,
            })
        });
        setLoading(false);

        if (res.status !== 200) {
            
            setFailCheck(failCheck + 1);

            if (failCheck > 2) {
                setTimeout(() => {
                    setFailCheck(0);
                }, 30*1000);
            }
            
            Swal.fire({
                title: "Login fail",
                icon: "error",
                text: "Make sure you choose the right user and enter the right password"
            });
            return;
        }

        const userDt = userData.find(e => e.id === userId);
        setSelectedUser({
            id: userId,
            host: userDt?.host ?? false,
            auth: "PASS",
            key: swConf.value
        });
    }

    async function save() {
        if (selectedUser.id < 0) {
            return;
        }

        const swConf = await Swal.fire({
            title: "Save changes?",
            icon: "question",
            showCancelButton: true,
            focusConfirm: false,
            reverseButtons: true,
            confirmButtonText: "Yes",
            cancelButtonText: "No"
        })
        
        if (!swConf.isConfirmed) {
            return;
        }

        const userDt = userData.find(usr => usr.id === selectedUser.id);
        if (userDt) {
            setLoading(true);
            const res = await fetch("/api/poll/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token: token,
                    userData: selectedUser,
                    attData: userDt.attendance,
                })
            })            

            if (res.status !== 200) {
                setLoading(false);
                Swal.fire({
                    title: "Server Error",
                    icon: "error",
                    text: "sorry for the inconvenience, please let admin know."
                });
                return;
            }
    
            await getPollData();
            setLoading(false);
        } 

        Swal.fire({
            title: "Data Saved!",
            icon: "success",
        });

        setSelectedUser({
            ...selectedUser,
            id: -1,
            host: false
        });
    }

    //-------------------------- NEW MEMBER MODAL --------------------------
    const [ newModal, setNewModal ] = useState({
        show: false,
        name: "",
        pass: "",
    });

    if (!pollExist) {
        return (
            <div className="flex flex-col w-screen h-screen p-3 gap-3">
                <div className="fixed h-full w-full z-10 flex flex-row">
                    <div className="bg-black opacity-40 fixed h-full w-full z-11"></div>
                    <div className="mx-auto flex flex-col">
                        <div className="my-auto rounded-lg p-8 border border-black bg-dark-secondary z-12 flex flex-col font-bold text-3xl gap-9">
                            <div className="w-full text-center">This poll doesn't exist... Or perhaps... The false hydra...</div>
                            <div className="w-full flex flex-row">
                                <button className="dark-button px-4 py-2 text-3xl rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center mx-auto"
                                    onClick={() => {window.location.href = "/"}} type="button"
                                >
                                    <FontAwesomeIcon icon={faHouse} />
                                    <div className="font-bold">Back</div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col w-screen h-screen p-3 gap-3">
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

            { newModal.show && 
                <div className="fixed h-full w-full z-10 flex flex-row">
                    <div className="bg-black opacity-40 fixed h-full w-full z-11" onClick={() => setNewModal({...newModal, show: false})}></div>
                    <div className="mx-auto flex flex-col">
                        <div className="my-auto rounded-lg p-8 border border-black bg-dark-secondary z-12 flex flex-col font-bold">
                            <div>TEST</div>
                        </div>
                    </div>
                </div>
            }
            <div className="bg-dark-secondary rounded-lg p-3 border border-gray-500 text-dark-text flex flex-col gap-2 h-[33%]">
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
                    <div className="h-full w-[30em] flex flex-col gap-3">
                        <div className="flex flex-row items-center">
                            <div className="font-bold text-xl me-auto">Members</div>
                            {
                                (selectedUser.id == -1) ?
                                <button className="bg-green-600 px-3 py-1 rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center"
                                    onClick={() => setNewModal({
                                        show: true,
                                        name: "",
                                        pass: ""
                                    })} type="button"
                                >
                                    <div className="font-bold">Let me join!</div>
                                    <FontAwesomeIcon icon={faPlus} />
                                </button>
                                : null
                            }
                        </div>
                        <div className="grow relative flex flex-col">
                            <div className="h-full w-full absolute gap-2 overflow-y-auto px-2">
                                <ul className="list-none font-bold">
                                    {
                                        userData.map((user, idx) => (
                                            <li key={'user-list-' + idx}><div className={"flex flex-row gap-2 items-center p-2 rounded border " + ((user.id === selectedUser.id) ? "bg-gray-700 border-green-500" : "border-gray-500")}>
                                                <FontAwesomeIcon icon={faUser}/>
                                                <div className="w-full">{user.name + (user.host ? " (host)" : "")} </div>
                                            </div></li>
                                        ))
                                    }
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="w-px mx-2 bg-white border-0"/>
                    <textarea
                        value={pollData.description}
                        placeholder="Description of the poll is here... If only the host provided one..."
                        className="transparent-input w-full p-2 rounded border font-light resize-none grow"
                        readOnly={true}
                    />
                    <div className="w-px mx-2 bg-white border-0"/>
                    <div className="h-full w-[30em] flex flex-col gap-2">
                        <div className="flex flex-row w-full justify-center items-center gap-3 font-bold text-2xl">
                            <FontAwesomeIcon icon={faQuestionCircle}/>
                            <div>Guide</div>
                            <FontAwesomeIcon icon={faQuestionCircle}/>
                        </div>
                        <hr className="h-px bg-gray-600 border-0"/>
                        <div className="grow px-3 font-bold text-sm">
                            <ul className="list-disc">
                                <li>Just click let me join to add your name.</li>
                                <li>Click pencil symbol next to your name in the table to edit your answer.</li>
                                <li>Editing as the host allows you to see extra information submitted.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-dark-secondary rounded-lg p-3 border border-gray-500 text-dark-text flex flex-col gap-2 grow">
                <div className="flex flex-row justify-between items-center font-bold text-xl">
                    <div>Timezone: {pollData.timezone}</div>
                    {
                        (selectedUser.id !== -1) ?
                            <button className="bg-green-600 px-3 py-1 rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center text-2xl"
                                onClick={save} type="button"
                            >
                                <FontAwesomeIcon icon={faFloppyDisk} />
                                <div className="font-bold">Save</div>
                            </button>
                        : null
                    }
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-row items-center gap-6">
                            <div className="flex flex-row items-center gap-2 select-none cursor-pointer" onClick={() => setBrushType(1)}>
                                <input type="radio" checked={brushType == 1} readOnly/>
                                <div>Preferred</div>
                                <div className="bg-white w-[2ch] h-[2ch] rounded-lg p-3 preferred"/>
                            </div>
                            <div className="flex flex-row items-center gap-2 select-none cursor-pointer" onClick={() => setBrushType(0)}>
                                <input type="radio" checked={brushType == 0} readOnly/>
                                <div>Open</div>
                                <div className="bg-white w-[2ch] h-[2ch] rounded-lg p-3 open"/>
                            </div>
                            <div className="flex flex-row items-center gap-2 select-none cursor-pointer" onClick={() => setBrushType(-1)}>
                                <input type="radio" checked={brushType == -1} readOnly/>
                                <div>No</div>
                                <div className="bg-white w-[2ch] h-[2ch] rounded-lg p-3 closed"/>
                            </div>
                        </div>
                        <div className="text-sm h-[2ch]">
                            {(selectedUser.id != -1) ? "Click and drag timeslot to fill" : ""
                        }
                        </div>
                    </div>
                </div>
                <div className='relative grow select-none flex flex-col'>
                    <div className="h-full w-full absolute overflow-auto m-2">
                        <table className='poll' style={{ width: 'auto' }}>
                            <thead className="sticky top-0" style={{ zIndex: 2 }}>
                                <tr>
                                    <th rowSpan={2} className='sticky left-0 top-0 align-middle text-center' style={{ zIndex: 2 }}>Name</th>
                                    { dates.map(date => (
                                        <th key={'header-' + date} colSpan={48}>{moment(date).format('YYYY-MM-DD (dddd)')}</th>
                                    ))}
                                </tr>
                                <tr>
                                    { dates.map((date) => {
                                        return Array.from(Array(24).keys()).map((timeslotIdx) => (
                                            <th key={date + "-" + timeslotIdx} className={"timeslot min-w-[6ch] ps-2 text-start " + (((timeslotIdx % 2) == 0) ? "even" : "odd")} colSpan={2}>
                                                {timeslotIdx}
                                            </th>
                                        ))
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {userData.map((user, idx) => (
                                    <tr key={'tr-' + idx} style={{ height: '3em' }} onMouseLeave={mouseLeave}>
                                        <th className='sticky text-nowrap left-0 align-middle px-3 min-w-[20ch]' style={{ zIndex: 1 }}>
                                            <div className='flex flex-row items-center gap-3 w-full'>
                                                <div className="me-auto">{user.name}</div>
                                                {
                                                    (selectedUser.id == -1) ?
                                                    <Fragment>
                                                        <FontAwesomeIcon className="cursor-pointer" icon={faPenToSquare} onClick={() => login(user.name, user.id)}/>
                                                    </Fragment>
                                                    : null
                                                }
                                            </div>
                                        </th>
                                        {dates.map((date) => {
                                            return Array.from(Array(24*2).keys()).map((idx2) => {
                                                const dateKey = date + "-" + idx2.toString();
                                                let attType = "open";

                                                if (hostClosed.includes(dateKey)) {
                                                    attType = "closed";
                                                } else if (dateKey in user.attendance) {
                                                    if (user.attendance[dateKey]) {
                                                        attType = "preferred";
                                                    } else {
                                                        attType = "closed";
                                                    }
                                                }

                                                if ((selectedUser.id == user.id) && ((!hostClosed.includes(dateKey)) || (selectedUser.host))) {
                                                    return <td 
                                                        key={idx + "-" + date + '-' + idx2} className={attType} onMouseUp={mouseLeave}
                                                        onMouseDown={() => mouseDown(date, idx2)} onMouseEnter={() => mouseEnter(date, idx2)}
                                                    ></td>;
                                                } else {
                                                    return <td 
                                                        key={idx + "-" + date + '-' + idx2} className={attType} onMouseUp={mouseLeave}
                                                    ></td>;
                                                }                                                
                                            })
                                        })}
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