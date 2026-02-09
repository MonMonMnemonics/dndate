import moment from "moment";
import { Fragment, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import type { UserData } from "@/common/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faCircleInfo, faDiceD20, faFloppyDisk, faHatWizard, faHouse, faInfoCircle, faLeaf, faLockOpen, faMaximize, faMinimize, faPenToSquare, faPersonChalkboard, faPlus, faQuestionCircle, faSpinner, faTrash, faUser, faUserPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { auxInfoEnum } from "@/common/consts";

interface NewModal {
    show: boolean,
    name: string,
    pass: string,
}

interface SelectedUser {
    id: number,
    host: boolean,
    auth: string,
    key: string,
    auxInfo: {[index: string]: any}
}

interface PollData {
    title: string,
    description: string,
    dateStart: string,
    dateEnd: string,
    timezone: string,
    open: boolean,
    auxInfo: {
        id: number,
        code: string
    }[]
    auxInfoCodes: string[]
}

export function Poll() {
    const { token } = useParams();
    const [ searchParams ] = useSearchParams();
    const [ pollExist, setPollExist ] = useState(true);
    const [ pollStyle, setPollStyle ] = useState("VERTICAL");
    const [ fullView, setFullView ] = useState(false);

    const [ pollData, setPollData ] = useState<PollData>({
        title: "POLL",
        description: "",
        dateStart: moment().format("YYYY-MM-DD"),
        dateEnd: moment().format("YYYY-MM-DD"),
        timezone: "GMT +00:00",
        open: true,
        auxInfo: [],
        auxInfoCodes: []
    });
    const [ dates, setDates ] = useState<string[]>([]);
    const [ userData, setUserData ] = useState<UserData[]>([]);

    useEffect(() => {
        getPollData();
        if ((searchParams.get("style") ?? "A").toUpperCase() == "B") {
            setPollStyle("HORIZONTAL");
        }
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

    async function getPollData(userId: number | null = null) {
        const res = await fetch("/api/poll/data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token: token,
                ott: (window.sessionStorage.getItem("OTT-" + token) ?? ""),
            })
        })

        if (res.status == 418) {
            setPollExist(false);
            return;
        }

        if (res.status != 200) {
            Swal.fire({
                title: "Server Error",
                theme: 'dark',
                icon: "error",
                text: "sorry for the inconvenience, please let admin know."
            });
        }

        const data = await res.json();
        const auxInfoCodes = (data.pollData.auxInfo ?? []).map((e : any) => e.code);
        data.pollData.auxInfoCodes = auxInfoCodes;
        data.userData = data.userData.map((dt: any) => {
            for (const code of auxInfoCodes) {
                if (!(code in dt.auxInfo)) {
                    dt.auxInfo[code] = "";
                }
            }

            return dt;
        });

        setPollData(data.pollData);
        setUserData(data.userData);

        if ((data.firstSetup ?? false) == true) {
            for (const usr of (data.userData ?? [])) {
                if (usr.host == true) {
                    setSelectedUser({
                        id: usr.id,
                        host: usr.host,
                        auth: "OTT",
                        key: (window.sessionStorage.getItem("OTT-" + token) ?? ""),
                        auxInfo: usr.auxInfo
                    });
                    break;
                }
            }
        } else if (userId) {
            const userDt = (data.userData ?? []).find((e: any) => e.id === userId);
            if (userDt) {
                setSelectedUser({
                    id: userId,
                    host: userDt.host ?? false,
                    auth: "PASS",
                    key: newModal.pass,
                    auxInfo: userDt.auxInfo
                });
            }
        }
    }

    async function withdrawApplication() {
        const swConf = await Swal.fire({
            title: "Withdraw?",
            theme: 'dark',
            icon: "warning",
            text: "Are you sure you want to withdraw your answer?",
            showCancelButton: true,
            focusConfirm: false,
            reverseButtons: true,
            cancelButtonText: "No",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes",
            confirmButtonColor: "#d33"
        })

        if (!swConf.isConfirmed) {
            return;
        }

        setLoading(true);
        const res = await fetch("/api/poll/withdraw", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token: token,
                userData: selectedUser,
            })
        });

        if (res.status !== 200) {
            setLoading(false);
            Swal.fire({
                title: "Server Error",
                theme: 'dark',
                icon: "error",
                text: "sorry for the inconvenience, please let admin know."
            });
            return;
        }

        await getPollData();
        setLoading(false);
        
        setSelectedUser({
            ...selectedUser,
            id: -1,
            host: false
        });
    }

    async function cancelPoll() {
        const swConf = await Swal.fire({
            title: "Delete poll?",
            theme: 'dark',
            icon: "warning",
            text: "Are you sure you want to delete this poll?",
            showCancelButton: true,
            focusConfirm: false,
            reverseButtons: true,
            cancelButtonText: "No",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes",
            confirmButtonColor: "#d33"
        })

        if (!swConf.isConfirmed) {
            return;
        }

        setLoading(true);
        const res = await fetch("/api/poll/delete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token: token,
                userData: selectedUser,
            })
        });

        if (res.status !== 200) {
            setLoading(false);
            Swal.fire({
                title: "Server Error",
                theme: 'dark',
                icon: "error",
                text: "sorry for the inconvenience, please let admin know."
            });
            return;
        }

        await getPollData();
        setLoading(false);
        
        setSelectedUser({
            ...selectedUser,
            id: -1,
            host: false
        });
    }

    async function switchClosePoll() {
        const swConf = await Swal.fire({
            title: pollData.open ? "Close poll?" : "Reopen Poll?",
            theme: 'dark',
            icon: "warning",
            text: pollData.open ? "Are you sure you want to close this poll?" : "Are you sure you want to reopen this poll?",
            showCancelButton: true,
            focusConfirm: false,
            reverseButtons: true,
            cancelButtonText: "No",
            confirmButtonText: "Yes",
        })

        if (!swConf.isConfirmed) {
            return;
        }

        setLoading(true);
        const res = await fetch("/api/poll/set-open", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token: token,
                userData: selectedUser,
                open: !pollData.open
            })
        });

        if (res.status !== 200) {
            setLoading(false);
            Swal.fire({
                title: "Server Error",
                theme: 'dark',
                icon: "error",
                text: "sorry for the inconvenience, please let admin know."
            });
            return;
        }

        await getPollData();
        setLoading(false);
        
        setSelectedUser({
            ...selectedUser,
            id: -1,
            host: false
        });
    }

    async function deleteUser(userName: string, userId: number) {
        const swConf = await Swal.fire({
            title: "Delete member?",
            theme: 'dark',
            icon: "warning",
            text: "Are you sure you want to delete member " + userName + " ?",
            showCancelButton: true,
            focusConfirm: false,
            reverseButtons: true,
            cancelButtonText: "No",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes",
            confirmButtonColor: "#d33"
        })

        if (!swConf.isConfirmed) {
            return;
        }

        setLoading(true);
        const res = await fetch("/api/poll/delete-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token: token,
                userData: selectedUser,
                userId: userId
            })
        });

        if (res.status !== 200) {
            setLoading(false);
            Swal.fire({
                title: "Server Error",
                theme: 'dark',
                icon: "error",
                text: "sorry for the inconvenience, please let admin know."
            });
            return;
        }

        await getPollData();
        setLoading(false);
    }

    //-------------------------- TABLE EDIT CONTROL --------------------------
    const [ selectedUser, setSelectedUser] = useState<SelectedUser>({
        id: -1,
        host: false,
        auth: "OTT",
        key: "",
        auxInfo: {}
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
            theme: 'dark',
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
                title: "Login failed",
                theme: 'dark',
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
                theme: 'dark',
                icon: "error",
                text: "Make sure you choose the right user and enter the right password"
            });
            return;
        }

        const data = await res.json();
        const updatedUserData = userData.map(dt => {
            if (dt.id.toString() in data) {
                dt.auxInfo = {
                    ...dt.auxInfo,
                    ...data[dt.id.toString()]
                }
            }
            return dt;
        })
        setUserData(updatedUserData);

        const userDt = updatedUserData.find(e => e.id === userId);
        if (userDt)  {
            setSelectedUser({
                id: userId,
                host: userDt.host ?? false,
                auth: "PASS",
                key: swConf.value,
                auxInfo: userDt.auxInfo
            });
        }

    }

    async function save() {
        if (selectedUser.id < 0) {
            return;
        }

        const swConf = await Swal.fire({
            title: "Save changes?",
            theme: 'dark',
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
            });

            if (res.status !== 200) {
                setLoading(false);
                Swal.fire({
                    title: "Server Error",
                    theme: 'dark',
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
            theme: 'dark',
            icon: "success",
        });

        setSelectedUser({
            ...selectedUser,
            id: -1,
            host: false
        });
    }

    //-------------------------- NEW MEMBER MODAL --------------------------
    const [ newModal, setNewModal ] = useState<NewModal>({
        show: false,
        name: "",
        pass: "",
    });

    async function submitNewUser() {
        setLoading(true);
        const res = await fetch("/api/poll/create-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: newModal.name,
                pass: newModal.pass,
                token: token
            })
        });

        if (res.status !== 200) {
            setLoading(false);
            Swal.fire({
                title: "Server Error",
                theme: 'dark',
                icon: "error",
                text: "sorry for the inconvenience, please let admin know."
            });
            return;
        }

        const resData = await res.json();
        await getPollData(resData.userId);

        setLoading(false);
        setNewModal({...newModal, show:false});
    }

    //-------------------------- AUX INFO MODAL --------------------------
    const [ auxInfoModal, setAuxInfoModal ] = useState<{
        show: boolean,
        name: string,
        auxInfo: {[index:string]: string}
    }>({
        show: false,
        name: "",
        auxInfo: {}
    })

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
            
            { //-------------------------- LOADING MODAL --------------------------
                loading && 
                <div className="fixed h-full w-full z-20 flex flex-row">
                    <div className="bg-black opacity-40 fixed h-full w-full z-21"></div>
                    <div className="mx-auto flex flex-col">
                        <div className="my-auto rounded-lg p-8 border border-black bg-dark-secondary z-22 flex flex-col font-bold text-3xl gap-5">
                            <div className="w-full flex flex-row justify-center">
                                <FontAwesomeIcon className="text-[10em] animate-spin" icon={faSpinner} />
                            </div>
                            <div className="w-full text-center">LOADING...</div>
                        </div>
                    </div>
                </div>
            }

            { //-------------------------- INFO MODAL --------------------------
                auxInfoModal.show && 
                <div className="fixed h-full w-full z-10 flex flex-row">
                    <div className="bg-black opacity-40 fixed h-full w-full z-11" onClick={() => setAuxInfoModal({...auxInfoModal, show: false})}></div>
                    <div className="mx-auto flex flex-col">
                        <div className="my-auto rounded-lg p-8 border border-black bg-dark-secondary z-12 flex flex-col font-bold gap-2 w-[30em]">
                            <div className="w-full text-center align-middle text-2xl">
                                {auxInfoModal.name}
                            </div>
                            <hr className="h-px my-2 bg-white border-0"/>
                            {
                                pollData.auxInfoCodes.includes(auxInfoEnum.discordHandle) ?
                                <div className="flex flex-row gap-2 items-center w-full">
                                    <div className="text-nowrap text-xl">Discord name:</div>
                                    <input
                                        value={auxInfoModal.auxInfo[auxInfoEnum.discordHandle]}
                                        placeholder="..."
                                        className="dark-input w-full p-2 rounded border font-light"
                                        readOnly={true}
                                    />
                                </div>
                                : null
                            }
                            {
                                pollData.auxInfoCodes.includes(auxInfoEnum.veils) ?
                                <div className="flex flex-col gap-2 items-center w-full">
                                    <div className="text-nowrap text-xl">Veils:</div>
                                    <textarea
                                        value={auxInfoModal.auxInfo[auxInfoEnum.veils]}
                                        placeholder="None"
                                        className="dark-input w-full p-2 rounded border font-light resize-none h-[7em]"
                                        readOnly={true}
                                    />
                                </div>
                                : null
                            }
                            {
                                pollData.auxInfoCodes.includes(auxInfoEnum.lines) ?
                                <div className="flex flex-col gap-2 items-center w-full">
                                    <div className="text-nowrap text-xl">Lines:</div>
                                    <textarea
                                        value={auxInfoModal.auxInfo[auxInfoEnum.lines]}
                                        placeholder="None"
                                        className="dark-input w-full p-2 rounded border font-light resize-none h-[7em]"
                                        readOnly={true}
                                    />
                                </div>
                                : null
                            }
                            <div className="flex flex-row items-center justify-center w- full">
                                <button className="bg-blue-600 px-3 py-1 rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center text-xl"
                                    onClick={() => setAuxInfoModal({...auxInfoModal, show: false})}
                                >
                                    <div className="font-bold">OK</div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            }

            { //-------------------------- NEW MODAL --------------------------
                newModal.show && 
                <div className="fixed h-full w-full z-10 flex flex-row">
                    <div className="bg-black opacity-40 fixed h-full w-full z-11" onClick={() => setNewModal({...newModal, show: false})}></div>
                    <form className="mx-auto flex flex-col">
                        <div className="my-auto rounded-lg p-8 border border-black bg-dark-secondary z-12 flex flex-col font-bold gap-2">
                            <div className="w-full text-center align-middle text-2xl">
                                Add New Member
                            </div>
                            <hr className="h-px my-2 bg-white border-0"/>
                            <div className="flex flex-row gap-2 items-center w-full">
                                <div className="text-nowrap text-xl">Name:</div>
                                <input
                                    type="text"
                                    value={newModal.name}
                                    onChange={(e) => setNewModal({...newModal, name: e.target.value})}
                                    placeholder="Username..."
                                    className="dark-input w-full p-2 rounded border font-light"
                                    maxLength={20}
                                    required
                                />
                            </div>
                            <div className="flex flex-col items-center w-full">
                                <div className="flex flex-row gap-2 items-center w-full">
                                    <div className="text-nowrap text-xl">Password:</div>
                                    <input
                                        type="password"
                                        value={newModal.pass}
                                        onChange={(e) => setNewModal({...newModal, pass: e.target.value})}
                                        placeholder="password"
                                        className="dark-input w-full p-2 rounded border font-light"
                                        maxLength={40}
                                        required
                                    />
                                </div>
                                <div className="text-sm">*You'll only need this password to edit your answer later</div>
                            </div>
                            <div className="flex flex-row items-center justify-between">
                                <button className="bg-red-600 px-3 py-1 rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center text-xl"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setNewModal({...newModal, show:false});
                                    }} type="button"
                                >
                                    <div className="font-bold">Cancel</div>
                                </button>
                                <button className="bg-green-600 px-3 py-1 rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center text-xl"
                                    onClick={(e) => {
                                        if ((newModal.name != "") && (newModal.pass != "")) {
                                            e.preventDefault();
                                            submitNewUser();
                                        }                                        
                                    }} type="submit"
                                >
                                    <FontAwesomeIcon icon={faUserPlus} />
                                    <div className="font-bold">Join the group!</div>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            }
            <div className={"bg-dark-secondary rounded-lg p-3 border border-gray-500 text-dark-text flex flex-col gap-2" + ((fullView) ? "" :  " h-[33%]")}>
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
                    {
                        (!pollData.open) ?
                            <div className="text-red-500 text-3xl font-bold border border-2 border-red-500 py-1 px-2 rounded">
                                POLL CLOSED
                            </div>
                        : null
                    }
                </div>
                {
                    (!fullView) &&
                    <Fragment>
                        <hr className="h-px my-2 bg-white border-0"/>
                        <div className="grow flex flex-row gap-2">
                            <div className="h-full w-[30em] flex flex-col gap-3">
                                <div className="flex flex-row items-center">
                                    <div className="font-bold text-xl me-auto">Members</div>
                                    {
                                        ((selectedUser.id == -1) && (pollData.open)) ?
                                        <button className="bg-green-600 px-3 py-1 rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center"
                                            onClick={() => setNewModal({
                                                show: true,
                                                name: "",
                                                pass: "",
                                            })} type="button"
                                        >
                                            <div className="font-bold">Join!</div>
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
                                                        <div className="w-full">{user.name + (user.host ? " (GM)" : "")} </div>
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
                                        <li>Just click "Join+" to add your name and fill in your availability.</li>
                                        <li>Click pencil symbol next to your name in the table to edit your answer.</li>
                                        <li>Editing as the host allows you to see extra information submitted.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>                        
                    </Fragment>
                }
            </div>
            <div className="bg-dark-secondary rounded-lg p-3 border border-gray-500 text-dark-text flex flex-col gap-2 grow">
                <div className="flex flex-row justify-between items-center font-bold text-xl">
                    <div>Timezone: {pollData.timezone}</div>
                    {
                        (selectedUser.id !== -1) ?
                            <div className="flex flex-row items-center gap-2">
                                <button className="bg-green-600 px-3 py-1 rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center text-xl"
                                    onClick={save} type="button"
                                >
                                    <FontAwesomeIcon icon={faFloppyDisk} />
                                    <div className="font-bold">Save</div>
                                </button>
                                {
                                    (!selectedUser.host) ?
                                        <Fragment>
                                            <button className="bg-red-600 px-3 py-1 rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center text-xl"
                                                onClick={withdrawApplication} type="button"
                                            >
                                                <FontAwesomeIcon icon={faXmark} />
                                                <div className="font-bold">Withdraw</div>
                                            </button>
                                        </Fragment>
                                    : <Fragment>
                                        <button className="bg-blue-600 px-3 py-1 rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center text-xl"
                                            onClick={switchClosePoll} type="button"
                                        >
                                            <FontAwesomeIcon icon={ pollData.open ? faBan : faLockOpen }/>
                                            <div className="font-bold">{ pollData.open ? "Close Poll" : "Reopen Poll" }</div>
                                        </button>
                                        <button className="bg-red-600 px-3 py-1 rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center text-xl"
                                            onClick={cancelPoll} type="button"
                                        >
                                            <FontAwesomeIcon icon={faXmark} />
                                            <div className="font-bold">Delete Poll</div>
                                        </button>
                                    </Fragment>
                                }
                                
                            </div>                            
                        : null
                    }
                    <div className="h-full flex flex-row items-center gap-5">
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-row items-center gap-6">
                                <div className="flex flex-row items-center gap-2 select-none cursor-pointer" onClick={() => setBrushType(1)}>
                                    {
                                        (selectedUser.id != -1) ? <input type="radio" checked={brushType == 1} readOnly/> : null
                                    }
                                    <div>Preferred</div>
                                    <div className="bg-white w-[2ch] h-[2ch] rounded-lg p-3 preferred"/>
                                </div>
                                <div className="flex flex-row items-center gap-2 select-none cursor-pointer" onClick={() => setBrushType(0)}>
                                    {
                                        (selectedUser.id != -1) ? <input type="radio" checked={brushType == 0} readOnly/> : null
                                    }
                                    <div>Open</div>
                                    <div className="bg-white w-[2ch] h-[2ch] rounded-lg p-3 open"/>
                                </div>
                                <div className="flex flex-row items-center gap-2 select-none cursor-pointer" onClick={() => setBrushType(-1)}>
                                    {
                                        (selectedUser.id != -1) ? <input type="radio" checked={brushType == -1} readOnly/> : null
                                    }
                                    <div>No</div>
                                    <div className="bg-white w-[2ch] h-[2ch] rounded-lg p-3 closed"/>
                                </div>
                            </div>
                            <div className="text-sm h-[2ch]">
                                {(selectedUser.id != -1) ? "Click and drag timeslot to fill" : ""
                            }
                            </div>
                        </div>
                        <button className="bg-dark rounded-xl border border-3 h-full aspect-square flex flex-col"
                            onClick={() => setFullView(!fullView)}
                        >
                            <div className="flex my-auto flex-row">
                                <FontAwesomeIcon icon={fullView ? faMinimize : faMaximize} className="mx-auto font-bold text-3xl"/>
                            </div>
                        </button>
                    </div>
                </div>
                <div className="flex flex-row text-sm font-bold items-center gap-4 px-2">
                    {
                        pollData.auxInfoCodes.includes(auxInfoEnum.firstTimer) ?
                        <div className="flex flex-row items-center gap-1">
                            <FontAwesomeIcon icon={faLeaf} className="text-green-600"/>
                            <div>: First-timer</div>
                        </div>
                        : null
                    }
                    {
                        pollData.auxInfoCodes.includes(auxInfoEnum.helpCharCreate) && (selectedUser.host) ?
                        <div className="flex flex-row items-center gap-1">
                            <FontAwesomeIcon icon={faPersonChalkboard}/>
                            <div>: Need a guide creating char</div>
                        </div>
                        : null
                    }
                </div>
                
                <div className="grow flex flex-row gap-5">
                    <div className='relative grow select-none flex flex-col'>
                        <div className="h-full w-full flex flex-col absolute overflow-auto ms-2 pe-2 pb-2">
                            {
                                (pollStyle == "HORIZONTAL") ?
                                <table className='poll me-2 horizontal' style={{ width: 'auto' }}>
                                    <thead className="sticky top-0" style={{ zIndex: 2 }}>
                                        <tr>
                                            <th rowSpan={2} className='sticky left-0 top-0 align-middle text-center text-2xl' style={{ zIndex: 6 }}>Name</th>
                                            { dates.map(date => (
                                                <th key={'header-' + date} className="date-header" colSpan={48}>{moment(date).format('YYYY-MM-DD (dddd)')}</th>
                                            ))}
                                        </tr>
                                        <tr>
                                            { dates.map((date, dateIdx) => {
                                                return Array.from(Array(24*2).keys()).map((timeslotIdx) => (
                                                    <th key={date + "-" + timeslotIdx} style={{ height: '3ch' }}
                                                        className={"timeslot horizontal relative min-w-[3.5ch] max-w-[3.5ch] text-start" + ((timeslotIdx % 2 == 0) ? " even" : " odd") + (((timeslotIdx == 0) && (dateIdx > 0)) ? " timeslotidx-0" : "")}
                                                    >
                                                        <div className="absolute ps-2 top-0 bg-dark" style={{ zIndex: 4 }}>{(timeslotIdx % 2 == 0) ? timeslotIdx/2 : ""}</div>                                                        
                                                    </th>
                                                ))
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userData.map((user, idx) => (
                                            <tr key={'tr-' + idx} style={{ height: '5ch' }} className={(user.id == selectedUser.id) ? "selected-row" : ""} onMouseLeave={mouseLeave}>
                                                <th className='sticky text-nowrap left-0 align-middle px-3 min-w-[30ch] name-cell' style={{ zIndex: 1 }}>
                                                    <div className='flex flex-row items-center gap-3 w-full'>
                                                        <div className="me-auto">{user.name}</div>
                                                        {
                                                            (user.host == true) ?
                                                            <div className='flex flex-row items-center gap-1'>
                                                                <div>GM</div>
                                                                <FontAwesomeIcon icon={faHatWizard}/>
                                                            </div>
                                                            : null
                                                        }
                                                        { pollData.auxInfoCodes.includes(auxInfoEnum.firstTimer) && (user.auxInfo[auxInfoEnum.firstTimer] ?? false) ?
                                                                <FontAwesomeIcon icon={faLeaf} className="text-green-600" />
                                                            : null
                                                        }
                                                        {
                                                            (selectedUser.id == -1) ?
                                                            <Fragment>
                                                                <FontAwesomeIcon className="cursor-pointer" icon={faPenToSquare} onClick={() => login(user.name, user.id)}/>
                                                            </Fragment>
                                                            : ((selectedUser.host) && (user.id !== selectedUser.id)) ?
                                                            <Fragment>
                                                                { pollData.auxInfoCodes.includes(auxInfoEnum.helpCharCreate) && (user.auxInfo[auxInfoEnum.helpCharCreate] ?? false) ?
                                                                        <FontAwesomeIcon icon={faPersonChalkboard}/>
                                                                    : null
                                                                }
                                                                {
                                                                    (pollData.auxInfo.length > 0) ?
                                                                    <FontAwesomeIcon className="cursor-pointer" icon={faCircleInfo} onClick={() => setAuxInfoModal({
                                                                        show: true,
                                                                        name: user.name,
                                                                        auxInfo: {
                                                                            [auxInfoEnum.discordHandle]: user.auxInfo[auxInfoEnum.discordHandle] ?? "",
                                                                            [auxInfoEnum.veils]: user.auxInfo[auxInfoEnum.veils] ?? "",
                                                                            [auxInfoEnum.lines]: user.auxInfo[auxInfoEnum.lines] ?? "",
                                                                        }
                                                                    })}/>
                                                                    : null
                                                                }
                                                                <FontAwesomeIcon className="cursor-pointer text-red-500" icon={faTrash} onClick={() => deleteUser(user.name, user.id)}/>
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
                                                        
                                                        if (idx2 % 2 == 0) {
                                                            attType += " even";
                                                        } else {
                                                            attType += " odd";
                                                        }

                                                        if (idx2 == 0) {
                                                            attType += " timeslotidx-0";
                                                        } else if (idx2 == 47) {
                                                            attType += " timeslotidx-47";
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
                                : (pollStyle == "VERTICAL") ?
                                <table className='poll w-full vertical' style={{ width: 'auto' }}>
                                    <tbody>
                                        {dates.map((date, dateIdx) => 
                                            <Fragment key={'v-' + date}>
                                                <tr><th colSpan={49} className={"date-header vertical" + ((dateIdx == 0) ? " first" : "")}>{moment(date).format('YYYY-MM-DD (dddd)')}</th></tr>
                                                <tr>
                                                    <th className="sticky left-0 left-border" style={{ zIndex:6 }}></th>
                                                    { Array.from(Array(24*2).keys()).map((timeslotIdx) => (
                                                        <th key={date + "-" + timeslotIdx} style={{ height: "4ch"}}
                                                            className={"timeslot horizontal relative text-start" 
                                                                + ((timeslotIdx % 2 == 0) ? " even" : " odd") 
                                                                + ((timeslotIdx == 0) ? " timeslotidx-0" : (timeslotIdx == 47) ? " timeslotidx-47" : "")
                                                                + " min-w-[3.5ch] max-w-[3.5ch]"
                                                            }
                                                        >
                                                            <div className="absolute ps-2 pb-1 bottom-0 bg-dark" style={{ zIndex: 4 }}>{(timeslotIdx % 2 == 0) ? timeslotIdx/2 : ""}</div>                                                        
                                                        </th>
                                                    ))}
                                                </tr>
                                                {userData.map((user, idx) => (
                                                    <tr key={'tr-' + idx} className={(user.id == selectedUser.id) ? "selected-row" : ""} style={{ height: '3em' }} onMouseLeave={mouseLeave}>
                                                        <th className={'sticky text-nowrap left-0 align-middle px-3 w-[310px] left-border name-cell'
                                                            + ((idx == userData.length - 1) ? " bottom-border" : "")
                                                        } style={{ zIndex: 1 }}>
                                                            <div className='flex flex-row items-center gap-3 w-full'>
                                                                <div className="me-auto">{user.name}</div>
                                                                {
                                                                    (user.host == true) ?
                                                                    <div className='flex flex-row items-center gap-1'>
                                                                        <div>GM</div>
                                                                        <FontAwesomeIcon icon={faDiceD20}/>
                                                                    </div>
                                                                    : null
                                                                }
                                                                { pollData.auxInfoCodes.includes(auxInfoEnum.firstTimer) && (user.auxInfo[auxInfoEnum.firstTimer] ?? false) ?
                                                                        <FontAwesomeIcon icon={faLeaf} className="text-green-600" />
                                                                    : null
                                                                }
                                                                {
                                                                    (selectedUser.id == -1) ?
                                                                    <Fragment>
                                                                        <FontAwesomeIcon className="cursor-pointer" icon={faPenToSquare} onClick={() => login(user.name, user.id)}/>
                                                                    </Fragment>
                                                                    : ((selectedUser.host) && (user.id !== selectedUser.id)) ?
                                                                    <Fragment>
                                                                        { pollData.auxInfoCodes.includes(auxInfoEnum.helpCharCreate) && (user.auxInfo[auxInfoEnum.helpCharCreate] ?? false) ?
                                                                                <FontAwesomeIcon icon={faPersonChalkboard}/>
                                                                            : null
                                                                        }
                                                                        {
                                                                            (pollData.auxInfo.length > 0) ?
                                                                            <FontAwesomeIcon className="cursor-pointer" icon={faCircleInfo} onClick={() => setAuxInfoModal({
                                                                                show: true,
                                                                                name: user.name,
                                                                                auxInfo: {
                                                                                    [auxInfoEnum.discordHandle]: user.auxInfo[auxInfoEnum.discordHandle] ?? "",
                                                                                    [auxInfoEnum.veils]: user.auxInfo[auxInfoEnum.veils] ?? "",
                                                                                    [auxInfoEnum.lines]: user.auxInfo[auxInfoEnum.lines] ?? "",
                                                                                }
                                                                            })}/>
                                                                            : null
                                                                        }
                                                                        <FontAwesomeIcon className="cursor-pointer text-red-500" icon={faTrash} onClick={() => deleteUser(user.name, user.id)}/>
                                                                    </Fragment>
                                                                    : null
                                                                }
                                                            </div>
                                                        </th>
                                                        { Array.from(Array(24*2).keys()).map((idx2) => {
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

                                                            if (idx2 % 2 == 0) {
                                                                attType += " even";
                                                            } else {
                                                                attType += " odd";
                                                            }

                                                            if (idx2 == 0) {
                                                                attType += " timeslotidx-0";
                                                            } else if (idx2 == 47) {
                                                                attType += " timeslotidx-47";
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
                                                        })}
                                                    </tr>
                                                ))}
                                            </Fragment>
                                        )}
                                    </tbody>
                                </table>
                                : null
                            }
                        </div>
                    </div>
                    {
                        ((pollData.auxInfo.length > 0) && (selectedUser.id != -1) && (!selectedUser.host) && (!fullView)) ?
                        <Fragment>
                            <div className="w-px ms-2 bg-white border-0"/>
                            <div className='relative flex flex-col w-[20em]'>
                                <div className="h-full w-full flex flex-col absolute overflow-x-hidden overflow-y-auto gap-3 pe-2">
                                    {
                                        pollData.auxInfo.map(infoDt => {
                                            switch (infoDt.code) {
                                                case (auxInfoEnum.discordHandle):
                                                    return (
                                                        <div className="flex flex-col gap-1 w-full" key={"input-" + infoDt.code}>
                                                            <div className="text-nowrap font-bold">Discord name:</div>
                                                            <input
                                                                type="text"
                                                                value={selectedUser.auxInfo[infoDt.code]}
                                                                onChange={(e) => setSelectedUser({...selectedUser, auxInfo: {...selectedUser.auxInfo, [auxInfoEnum.discordHandle]: e.target.value}})}
                                                                placeholder="Discord name..."
                                                                className="dark-input w-full p-2 rounded border font-light"
                                                                maxLength={50}
                                                            />
                                                        </div>
                                                    )

                                                case (auxInfoEnum.firstTimer):
                                                    return (
                                                        <div className="flex flex-col gap-1 w-full" key={"input-" + infoDt.code}>
                                                            <div className="text-nowrap font-bold">Is this your first game?</div>
                                                            <div className="flex flex-row justify-evenly items-center text-xl font-bold">
                                                                <div className="flex flex-row items-center gap-2 select-none cursor-pointer" 
                                                                    onClick={() => setSelectedUser({...selectedUser, auxInfo: {...selectedUser.auxInfo, [auxInfoEnum.firstTimer]: true}})}
                                                                >
                                                                    <input type="checkbox" checked={selectedUser.auxInfo[infoDt.code] === true} readOnly/>
                                                                    <div>Yes</div>
                                                                </div>
                                                                <div className="flex flex-row justify-evenly items-center">
                                                                    <div className="flex flex-row items-center gap-2 select-none cursor-pointer" 
                                                                        onClick={() => setSelectedUser({...selectedUser, auxInfo: {...selectedUser.auxInfo, [auxInfoEnum.firstTimer]: false}})}
                                                                    >
                                                                        <input type="checkbox" checked={selectedUser.auxInfo[infoDt.code] === false} readOnly/>
                                                                        <div>No</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )

                                                case (auxInfoEnum.helpCharCreate):
                                                    return (
                                                        <div className="flex flex-col gap-1 w-full" key={"input-" + infoDt.code}>
                                                            <div className="font-bold">Do you need help creating your char?</div>
                                                            <div className="flex flex-row justify-evenly items-center text-xl font-bold">
                                                                <div className="flex flex-row items-center gap-2 select-none cursor-pointer" 
                                                                    onClick={() => setSelectedUser({...selectedUser, auxInfo: {...selectedUser.auxInfo, [auxInfoEnum.helpCharCreate]: true}})}
                                                                >
                                                                    <input type="checkbox" checked={selectedUser.auxInfo[infoDt.code] === true} readOnly/>
                                                                    <div>Yes</div>
                                                                </div>
                                                                <div className="flex flex-row justify-evenly items-center">
                                                                    <div className="flex flex-row items-center gap-2 select-none cursor-pointer" 
                                                                        onClick={() => setSelectedUser({...selectedUser, auxInfo: {...selectedUser.auxInfo, [auxInfoEnum.helpCharCreate]: false}})}
                                                                    >
                                                                        <input type="checkbox" checked={selectedUser.auxInfo[infoDt.code] === false} readOnly/>
                                                                        <div>No</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )

                                                case (auxInfoEnum.veils):
                                                    return (
                                                        <div className="flex flex-col gap-1 w-full" key={"input-" + infoDt.code}>
                                                            <div className="font-bold">Veils (subjects you are not comfortable with):</div>
                                                           <textarea
                                                                value={selectedUser.auxInfo[infoDt.code]}
                                                                onChange={(e) => setSelectedUser({...selectedUser, auxInfo: {...selectedUser.auxInfo, [auxInfoEnum.veils]: e.target.value}})}
                                                                placeholder="None"
                                                                className="dark-input w-full p-2 rounded border font-light resize-none h-[4em]"
                                                                maxLength={400}
                                                            />
                                                        </div>
                                                    )

                                                case (auxInfoEnum.lines):
                                                    return (
                                                        <div className="flex flex-col gap-1 w-full" key={"input-" + infoDt.code}>
                                                            <div className="font-bold">Lines (subjects you absolutely don't want to come across):</div>
                                                           <textarea
                                                                value={selectedUser.auxInfo[infoDt.code]}
                                                                onChange={(e) => setSelectedUser({...selectedUser, auxInfo: {...selectedUser.auxInfo, [auxInfoEnum.lines]: e.target.value}})}
                                                                placeholder="None"
                                                                className="dark-input w-full p-2 rounded border font-light resize-none h-[4em]"
                                                                maxLength={400}
                                                            />
                                                        </div>
                                                    )
                                            
                                                default:
                                                    return null
                                            }
                                        })
                                    }
                                </div>
                            </div>
                        </Fragment>                        
                        : null
                    }
                </div>                
            </div>
        </div>
    );
}

export default Poll;