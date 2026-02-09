import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

export const NewUserModal = ({ show, closeModal, submitNewUser }: { show: boolean, closeModal: (() => void), submitNewUser: ((name: string, pass: string) => void)}) => {
    const [ name, setName ] = useState("");
    const [ pass, setPass ] = useState("");

    if (show) {
        return(
            <div className="fixed h-full w-full z-10 flex flex-row">
                <div className="bg-black opacity-40 fixed h-full w-full z-11" onClick={closeModal}></div>
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
                                value={name}
                                onChange={(e) => setName(e.target.value)}
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
                                    value={pass}
                                    onChange={(e) => setPass(e.target.value)}
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
                                    closeModal();
                                }} type="button"
                            >
                                <div className="font-bold">Cancel</div>
                            </button>
                            <button className="bg-green-600 px-3 py-1 rounded border flex items-center justify-center gap-2 font-light flex flex-row gap-2 items-center text-xl"
                                onClick={(e) => {
                                    if ((name != "") && (pass != "")) {
                                        e.preventDefault();
                                        submitNewUser(name, pass);
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
        )
    } else {
        return null;
    }
}