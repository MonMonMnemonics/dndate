import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { Fragment, useEffect, useState } from "react";
import { auxInfoEnum } from "@/common/consts";

type Props = { 
    show: boolean;
    editMode: boolean;
    auxInfo: {id:number, code: string}[];
    initData: {[index: string]: any};
    closeModal: (() => void);
    submitData: ((data: {[index : string]: any}) => void);
}

export const UserInfoModal = ({ show, editMode, auxInfo, initData, closeModal, submitData }: Props) => {
    const [data, setData] = useState({name: "", pass: ""});
    const [auxData, setAuxData] = useState<{[index:string]: any}>({})

    useEffect(() => {
        if (show) {
            setData({
                name: initData.name ?? "",
                pass: initData.pass ?? ""
            });

            let newAuxData : {[index:string]: any} = {}
            for (const infoDt of auxInfo) {
                newAuxData[infoDt.code] = initData[infoDt.code] ?? "";
            }
            setAuxData(newAuxData);
        }        
    }, [show]);

    if (show) {
        return(
            <div className="fixed h-full w-full z-10 flex flex-row">
                <div className="bg-black opacity-40 fixed h-full w-full z-11" onClick={closeModal}></div>
                <form className="mx-auto flex flex-col">
                    <div className="my-auto rounded-lg p-8 border border-black bg-dark-secondary z-12 flex flex-col font-bold gap-2 max-h-[90vh]">
                        <div className="w-full text-center align-middle text-2xl">
                            {editMode ? initData.name : "Add New Member"}
                        </div>
                        <hr className="h-px my-2 bg-white border-0"/>
                        <div className="flex flex-col gap-2 overflow-y-auto">
                            {   (editMode) ? null
                                : <Fragment>
                                    <div className="flex flex-row gap-2 items-center w-full">
                                        <div className="text-nowrap text-xl">Name:</div>
                                        <input
                                            type="text"
                                            value={data.name ?? ""}
                                            onChange={(e) => setData({...data, name: e.target.value})}
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
                                                value={data.pass ?? ""}
                                                onChange={(e) => setData({...data, pass: e.target.value})}
                                                placeholder="password"
                                                className="dark-input w-full p-2 rounded border font-light"
                                                maxLength={40}
                                                required
                                            />
                                        </div>
                                        <div className="text-sm">*You'll only need this password to edit your answer later</div>
                                    </div>
                                    <hr className="h-px my-2 bg-white border-0"/>
                                </Fragment>
                            }
                            {
                                (auxInfo.length > 0) ?
                                <Fragment>
                                    {
                                        auxInfo.map(infoDt => {
                                            switch (infoDt.code) {
                                                case (auxInfoEnum.discordHandle):
                                                    return (
                                                        <div className="flex flex-col gap-1 w-full" key={"input-" + infoDt.code}>
                                                            <div className="text-nowrap font-bold">Discord name:</div>
                                                            <input
                                                                type="text"
                                                                value={auxData[infoDt.code] ?? ""}
                                                                onChange={(e) => setAuxData({...auxData, [auxInfoEnum.discordHandle]: e.target.value})}
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
                                                                    onClick={() => setAuxData({...auxData, [auxInfoEnum.firstTimer]: true})}
                                                                >
                                                                    <input type="checkbox" checked={(auxData[infoDt.code] ?? "") === true} readOnly/>
                                                                    <div>Yes</div>
                                                                </div>
                                                                <div className="flex flex-row justify-evenly items-center">
                                                                    <div className="flex flex-row items-center gap-2 select-none cursor-pointer" 
                                                                        onClick={() => setAuxData({...auxData, [auxInfoEnum.firstTimer]: false})}
                                                                    >
                                                                        <input type="checkbox" checked={(auxData[infoDt.code] ?? "" ) === false} readOnly/>
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
                                                                    onClick={() => setAuxData({...auxData, [auxInfoEnum.helpCharCreate]: true})}
                                                                >
                                                                    <input type="checkbox" checked={(auxData[infoDt.code] ?? "") === true} readOnly/>
                                                                    <div>Yes</div>
                                                                </div>
                                                                <div className="flex flex-row justify-evenly items-center">
                                                                    <div className="flex flex-row items-center gap-2 select-none cursor-pointer" 
                                                                        onClick={() => setAuxData({...auxData, [auxInfoEnum.helpCharCreate]: false})}
                                                                    >
                                                                        <input type="checkbox" checked={(auxData[infoDt.code] ?? "") === false} readOnly/>
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
                                                                value={auxData[infoDt.code] ?? ""}
                                                                onChange={(e) => setAuxData({...auxData, [auxInfoEnum.veils]: e.target.value})}
                                                                placeholder="None"
                                                                className="dark-input w-full p-2 rounded border font-light resize-none h-[7em]"
                                                                maxLength={400}
                                                            />
                                                        </div>
                                                    )
        
                                                case (auxInfoEnum.lines):
                                                    return (
                                                        <div className="flex flex-col gap-1 w-full" key={"input-" + infoDt.code}>
                                                            <div className="font-bold">Lines (subjects you absolutely don't want to come across):</div>
                                                            <textarea
                                                                value={auxData[infoDt.code] ?? ""}
                                                                onChange={(e) => setAuxData({...auxData, [auxInfoEnum.lines]: e.target.value})}
                                                                placeholder="None"
                                                                className="dark-input w-full p-2 rounded border font-light resize-none h-[7em]"
                                                                maxLength={400}
                                                            />
                                                        </div>
                                                    )
                                            
                                                default:
                                                    return null
                                            }
                                        })
                                    }
                                </Fragment>
                                : null
                            }
                            <div className="flex flex-row items-center justify-between">
                                <button className="bg-red-600 px-3 py-1 rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center text-xl"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        closeModal();
                                    }} type="button"
                                >
                                    <div className="font-bold">Cancel</div>
                                </button>
                                <button className="bg-green-600 px-3 py-1 rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center text-xl"
                                    onClick={(e) => {
                                        if ((((data.name ?? "") != "") && ((data.pass ?? "") != "")) || (editMode)) {
                                            e.preventDefault();
                                            submitData({
                                                ...data,
                                                auxInfo: auxData
                                            });
                                        }                                        
                                    }} type="submit"
                                >
                                    <FontAwesomeIcon icon={faFloppyDisk} />
                                    <div className="font-bold">{editMode ? "Save" : "Join the group!"}</div>
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        )
    } else {
        return null;
    }
}