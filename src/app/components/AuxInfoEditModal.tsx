import { useEffect, useState } from "react";
import { auxInfoEnum } from "@/common/consts";

type Props = { 
    show: boolean;
    auxInfo: {id:number, code: string}[];
    initData: {[index: string]: any};
    closeModal: (() => void);
    saveData: ((newAuxData: {[index: string]: string}) => void);
}

export const AuxInfoEditModal = ({ show, closeModal, auxInfo, initData, saveData }: Props) => {
    const [ data, setData ] = useState(initData)

    useEffect(() => {
        if (show) {
            setData(initData)
        }        
    }, [show]);

    if (show) {
        return(
            <div className="fixed h-full w-full z-10 flex flex-row">
                <div className="bg-black opacity-40 fixed h-full w-full z-11" onClick={closeModal}></div>
                <div className="mx-auto flex flex-col">
                    <div className="my-auto rounded-lg p-8 border border-black bg-dark-secondary z-12 flex flex-col font-bold gap-2 w-[25em]">
                        <div className="h-full w-full flex flex-col gap-3 pe-2">
                            {
                                auxInfo.map(infoDt => {
                                    switch (infoDt.code) {
                                        case (auxInfoEnum.discordHandle):
                                            return (
                                                <div className="flex flex-col gap-1 w-full" key={"input-" + infoDt.code}>
                                                    <div className="text-nowrap font-bold">Discord name:</div>
                                                    <input
                                                        type="text"
                                                        value={data[infoDt.code]}
                                                        onChange={(e) => setData({...data, [auxInfoEnum.discordHandle]: e.target.value})}
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
                                                            onClick={() => setData({...data, [auxInfoEnum.firstTimer]: true})}
                                                        >
                                                            <input type="checkbox" checked={data[infoDt.code] === true} readOnly/>
                                                            <div>Yes</div>
                                                        </div>
                                                        <div className="flex flex-row justify-evenly items-center">
                                                            <div className="flex flex-row items-center gap-2 select-none cursor-pointer" 
                                                                onClick={() => setData({...data, [auxInfoEnum.firstTimer]: false})}
                                                            >
                                                                <input type="checkbox" checked={data[infoDt.code] === false} readOnly/>
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
                                                            onClick={() => setData({...data, [auxInfoEnum.helpCharCreate]: true})}
                                                        >
                                                            <input type="checkbox" checked={data[infoDt.code] === true} readOnly/>
                                                            <div>Yes</div>
                                                        </div>
                                                        <div className="flex flex-row justify-evenly items-center">
                                                            <div className="flex flex-row items-center gap-2 select-none cursor-pointer" 
                                                                onClick={() => setData({...data, [auxInfoEnum.helpCharCreate]: false})}
                                                            >
                                                                <input type="checkbox" checked={data[infoDt.code] === false} readOnly/>
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
                                                        value={data[infoDt.code]}
                                                        onChange={(e) => setData({...data, [auxInfoEnum.veils]: e.target.value})}
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
                                                        value={data[infoDt.code]}
                                                        onChange={(e) => setData({...data, [auxInfoEnum.lines]: e.target.value})}
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
                            <div className="flex flex-row items-center justify-between">
                                <button className="bg-red-600 px-3 py-1 rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center text-xl"
                                    onClick={closeModal} 
                                >
                                    <div className="font-bold">Cancel</div>
                                </button>
                                <button className="bg-green-600 px-3 py-1 rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center text-xl"
                                    onClick={() => saveData(data)}
                                >
                                    <div className="font-bold">Save change</div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else {
        return null;
    }
}