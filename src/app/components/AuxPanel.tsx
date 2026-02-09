import { memo, Fragment } from 'react';
import type { FC } from 'react';
import type { PollData, SelectedUser } from '@/common/types';
import { auxInfoEnum } from "@/common/consts";

type Props = {
    show: boolean;
    pollData: PollData;
    selectedUser: SelectedUser;
    setSelectedUser: ((n : SelectedUser) => void)
};

export const AuxPanel: FC<Props> = memo(({ 
    show,
    pollData,
    selectedUser,
    setSelectedUser
}) => {
    if (show) {
        return (
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
        )
    } else {
        return null;
    }
})