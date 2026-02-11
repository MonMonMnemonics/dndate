export interface UserData {
    id: number,
    name: string,
    host: boolean,
    attendance: {[index: string]: boolean},
    auxInfo: {[index: string]: any}
}

export interface SelectedUser {
    id: number,
    host: boolean,
    auth: string,
    key: string,
    auxInfo: {[index: string]: any}
}

export interface PollData {
    title: string,
    description: string,
    dateStart: string,
    dateEnd: string,
    timezone: string,
    open: boolean,
    timeslotHostLock: boolean,
    auxInfo: {
        id: number,
        code: string
    }[]
    auxInfoCodes: string[]
}