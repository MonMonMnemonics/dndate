import moment from "moment";
import { Fragment, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import type { UserData, SelectedUser, PollData } from "@/common/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faFloppyDisk, faHouse, faInfoCircle, faLeaf, faLockOpen, faMaximize, faMinimize, faPersonChalkboard, faPlus, faQuestionCircle, faSpinner, faUser, faXmark } from "@fortawesome/free-solid-svg-icons";
import { auxInfoEnum } from "@/common/consts";
import { ScheduleTable } from "../components/ScheduleTable";
import { UserInfoModal } from "../components/UserInfoModal";

interface UserModal {
    show: boolean,
    editMode: boolean,
    initData: {[index:string]: any}
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
        auxInfoCodes: [],
    });
    const [ userData, setUserData ] = useState<UserData[]>([]);

    useEffect(() => {
        getPollData();
        if ((searchParams.get("style") ?? "A").toUpperCase() == "B") {
            setPollStyle("HORIZONTAL");
        }
    }, []);

    async function getPollData() {
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
    const [ loading, setLoading ] = useState(false);
    const [ failCheck, setFailCheck ] = useState(0);

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
            setBrushType(1);
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
            const res = await fetch("/api/poll/save-att", {
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

    //-------------------------- USER MODAL --------------------------
    const [ UserModal, setUserModal ] = useState<UserModal>({
        show: false,
        editMode: false,
        initData: {}
    });

    async function submitNewUser(data: {[index: string]: any}) {
        setLoading(true);
        const res = await fetch("/api/poll/create-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: data.name,
                pass: data.pass,
                auxInfo: data.auxInfo ?? {},
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
        await getPollData();

        setSelectedUser({
            id: resData.userId,
            host: false,
            auth: "PASS",
            key: data.pass,
            auxInfo: data.auxInfo ?? {}
        });
        
        setUserModal({
            show: false,
            editMode: false,
            initData: {}
        });

        setLoading(false);
        setBrushType(1);
    }

    async function submitInfoChange(data: {[index: string]: any}) {
        if (selectedUser.id < 0) {
            return;
        }

        const userDt = userData.find(usr => usr.id === selectedUser.id);
        if (userDt) {
            setLoading(true);
            const res = await fetch("/api/poll/save-info", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token: token,
                    userData: {
                        ...selectedUser,
                        auxInfo: data
                    },
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
    
            setUserData(userData.map(usr => {
                if (usr.id == selectedUser.id) {
                    usr.auxInfo = {
                        ...usr.auxInfo,
                        ...data
                    };
                }
                return usr;
            }));
            setLoading(false);
        } 

        setSelectedUser({
            ...selectedUser,
            auxInfo: data
        });

        setUserModal({
            show: false,
            editMode: false,
            initData: {}
        });
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

            <UserInfoModal
                show={UserModal.show}
                editMode={UserModal.editMode}
                closeModal={() => setUserModal({...UserModal, show: false})}
                auxInfo={pollData.auxInfo}
                submitData={(data) => (UserModal.editMode) ? submitInfoChange(data.auxInfo ?? {}) : submitNewUser(data)}
                initData={UserModal.initData}                
            />

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
                                            onClick={() => setUserModal({
                                                show: true,
                                                editMode: false,
                                                initData: {}
                                            })}
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
                                            {
                                                (pollData.auxInfo.length > 0) ?
                                                    <button className="bg-blue-600 px-3 py-1 rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center text-xl"
                                                        onClick={() => setUserModal({
                                                            show: true,
                                                            editMode: true,
                                                            initData: {
                                                                ...selectedUser.auxInfo,
                                                                name: (userData.find(e => e.id === selectedUser.id)?.name ?? "")
                                                            }
                                                        })} type="button"
                                                    >
                                                        <FontAwesomeIcon icon={faInfoCircle} />
                                                        <div className="font-bold">Edit Answer</div>
                                                    </button>
                                                : null
                                            }
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
                    <ScheduleTable
                        pollStyle={pollStyle}
                        userData={userData}
                        dateEnd={pollData.dateEnd}
                        dateStart={pollData.dateStart}
                        auxInfoCodes={pollData.auxInfoCodes}
                        activeUserId={selectedUser.id}
                        isHost={selectedUser.host}

                        login={login}
                        switchCellColour={switchCellColour}
                        deleteUser={deleteUser}
                        setAuxInfoModal={setAuxInfoModal}
                    />
                </div>
            </div>
        </div>
    );
}

export default Poll;