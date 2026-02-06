export interface UserData {
    name: string,
    host: boolean,
    attendance: {
        date: string,
        timeslot: number,
        val: boolean
    }[]
}