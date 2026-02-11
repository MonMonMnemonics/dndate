import { memo, Fragment, useState, useEffect } from 'react';
import moment from "moment";
import type { FC } from 'react';
import type { UserData } from '@/common/types';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDay, faCalendarDays, faCircleInfo, faDiceD20, faLeaf, faPenToSquare, faPersonChalkboard, faShare, faTrash } from "@fortawesome/free-solid-svg-icons";
import { auxInfoEnum } from "@/common/consts";
import Swal from 'sweetalert2';

type Props = {
    pollStyle: string;
    userData: UserData[];
    activeUserId: number;
    isHost: boolean;
    dateStart: string;
    dateEnd: string;
    auxInfoCodes: string[];
    timeslotHostLock: boolean;

    login: ((userName: string, userId: number) => void);
    switchCellColour: ((date: string, timeslotIdx: number) => void);
    deleteUser: ((userName: string, userId: number) => void);
    setAuxInfoModal: ((n : any) => void);
};

export const ScheduleTable: FC<Props> = memo(({ 
    pollStyle,
    userData,
    activeUserId,
    isHost,
    dateStart,
    dateEnd,
    auxInfoCodes,
    timeslotHostLock,

    login,
    switchCellColour,
    deleteUser,
    setAuxInfoModal,
}) => {
    const [ brushActive, setBrushActive ] = useState(false);
    
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

    const [ dates, setDates ] = useState<string[]>([]);
    useEffect(() => {
        let start = moment(dateStart);
        const end = moment(dateEnd);

        let dateArray: string[] = [];
        while (!start.isAfter(end)) {
            dateArray.push(start.format("YYYY-MM-DD"));
            start = start.add(1, "d");
        }

        setDates(dateArray);
        
    }, [dateStart, dateEnd])

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

    //-------------------------- AUX COMPONENTS --------------------------
    const TimeslotCell = (date: string, timeslotIdx: number, user: UserData) => {
        const dateKey = date + "-" + timeslotIdx.toString();
        let attType = "open";

        if (hostClosed.includes(dateKey) && timeslotHostLock) {
            attType = "closed"; 
        } else if (dateKey in user.attendance) {
            if (user.attendance[dateKey]) {
                attType = "preferred";
            } else {
                attType = "closed";
            }
        }

        if (hostClosed.includes(dateKey)) {
            attType += " host-unavail"
        }

        if (timeslotIdx % 2 == 0) {
            attType += " even";
        } else {
            attType += " odd";
        }

        if (timeslotIdx == 0) {
            attType += " timeslotidx-0";
        } else if (timeslotIdx == 47) {
            attType += " timeslotidx-47";
        }

        if ((activeUserId == user.id) && ((!hostClosed.includes(dateKey)) || (isHost) || (!timeslotHostLock))) {
            return <td 
                key={user.id + "-" + date + "-" + timeslotIdx} className={attType} onMouseUp={mouseLeave}
                onMouseDown={() => mouseDown(date, timeslotIdx)} onMouseEnter={() => mouseEnter(date, timeslotIdx)}
            ></td>;
        } else {
            return <td 
                key={user.id + "-" + date + "-" + timeslotIdx}
                className={attType} onMouseUp={mouseLeave}
            ></td>;
        }
    }

    const DateHeader = (date: string, dateIdx: number) => {
        let className = "date-header " + pollStyle.toLowerCase();
        if (pollStyle == "VERTICAL") {
            if (dateIdx == 0) {
                className += " first";
            }
        }

        return(
            <th key={'header-' + date} id={"DateHeader-" + date} className={className} colSpan={(pollStyle == "VERTICAL") ? 49 : 48}>
                <div className='flex flex-row items-center justify-center'>
                    <div>{moment(date).format('YYYY-MM-DD (dddd)')}</div>
                    <p title='Jump to date' className='cursor-pointer' 
                        onClick={async () => {
                            const res = await Swal.fire({
                                title: "Jump to date",
                                input: "date",
                                theme: "dark",
                                confirmButtonText: "Jump",
                                inputAttributes: {
                                    min: dateStart,
                                    max: dateEnd,
                                },
                                inputValue: date
                            })

                            if (res.isConfirmed) {
                                const dateEl = document.getElementById("DateHeader-" + res.value);
                                if (dateEl) {
                                    if (pollStyle == "VERTICAL") {
                                        dateEl.scrollIntoView({
                                            behavior: "smooth",
                                            block: "start",
                                        })
                                    } else {
                                        dateEl.scrollIntoView({
                                            behavior: "smooth",
                                            inline: "end"
                                        })
                                    }                                    
                                }
                            }
                        }}
                    >
                        <FontAwesomeIcon icon={faCalendarDays} className='mt-1'/>
                        </p>
                </div>                
            </th>
        )
    }

    return (
        <div className='relative grow select-none flex flex-col'>
            <div className="max-h-full w-full flex flex-col absolute overflow-auto ms-2 pe-2 pb-2">
                {
                    (pollStyle == "HORIZONTAL") ?
                    <table className='poll me-2 horizontal' style={{ width: 'auto' }}>
                        <thead className="sticky top-0" style={{ zIndex: 2 }}>
                            <tr>
                                <th rowSpan={2} className='sticky left-0 top-0 align-middle text-center text-2xl first-col' style={{ zIndex: 6 }}>Name</th>
                                { dates.map((date, dateIdx) => DateHeader(date, dateIdx))}
                            </tr>
                            <tr>
                                { dates.map((date, dateIdx) => {
                                    return Array.from(Array(24*2).keys()).map((timeslotIdx) => (
                                        <th key={date + "-" + timeslotIdx} style={{ height: '3ch' }}
                                            className={"timeslot horizontal relative min-w-[3.5ch] max-w-[3.5ch] text-start" 
                                                + ((timeslotIdx % 2 == 0) ? " even" : " odd") 
                                                + ((timeslotIdx == 47) ? " timeslotidx-47" : "")}
                                        >
                                            <div className="absolute ps-2 top-0 bg-dark" style={{ zIndex: 4 }}>{(timeslotIdx % 2 == 0) ? timeslotIdx/2 : ""}</div>                                                        
                                        </th>
                                    ))
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {userData.map((user, idx) => (
                                <tr key={'tr-' + idx} style={{ height: '5ch' }} className={(user.id == activeUserId) ? "selected-row" : ""} onMouseLeave={mouseLeave}>
                                    <th className='sticky text-nowrap left-0 align-middle px-3 min-w-[30ch] name-cell first-col' style={{ zIndex: 1 }}>
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
                                            { auxInfoCodes.includes(auxInfoEnum.firstTimer) && (user.auxInfo[auxInfoEnum.firstTimer] ?? false) ?
                                                    <FontAwesomeIcon icon={faLeaf} className="text-green-600" />
                                                : null
                                            }
                                            {
                                                (activeUserId == -1) ?
                                                <Fragment>
                                                    <FontAwesomeIcon className="cursor-pointer" icon={faPenToSquare} onClick={() => login(user.name, user.id)}/>
                                                </Fragment>
                                                : ((isHost) && (user.id !== activeUserId)) ?
                                                <Fragment>
                                                    { auxInfoCodes.includes(auxInfoEnum.helpCharCreate) && (user.auxInfo[auxInfoEnum.helpCharCreate] ?? false) ?
                                                            <FontAwesomeIcon icon={faPersonChalkboard}/>
                                                        : null
                                                    }
                                                    {
                                                        (auxInfoCodes.length > 0) ?
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
                                        return Array.from(Array(24*2).keys()).map((idx2) => TimeslotCell(date, idx2, user))
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
                                    <tr>{DateHeader(date, dateIdx)}</tr>
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
                                        <tr key={'tr-' + idx} className={(user.id == activeUserId) ? "selected-row" : ""} style={{ height: '3em' }} onMouseLeave={mouseLeave}>
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
                                                    { auxInfoCodes.includes(auxInfoEnum.firstTimer) && (user.auxInfo[auxInfoEnum.firstTimer] ?? false) ?
                                                            <FontAwesomeIcon icon={faLeaf} className="text-green-600" />
                                                        : null
                                                    }
                                                    {
                                                        (activeUserId == -1) ?
                                                        <Fragment>
                                                            <FontAwesomeIcon className="cursor-pointer" icon={faPenToSquare} onClick={() => login(user.name, user.id)}/>
                                                        </Fragment>
                                                        : ((isHost) && (user.id !== activeUserId)) ?
                                                        <Fragment>
                                                            { auxInfoCodes.includes(auxInfoEnum.helpCharCreate) && (user.auxInfo[auxInfoEnum.helpCharCreate] ?? false) ?
                                                                    <FontAwesomeIcon icon={faPersonChalkboard}/>
                                                                : null
                                                            }
                                                            {
                                                                (auxInfoCodes.length > 0) ?
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
                                            { Array.from(Array(24*2).keys()).map((idx2) => TimeslotCell(date, idx2, user)) }
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
    )
});