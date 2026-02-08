export interface UserData {
    id: number,
    name: string,
    host: boolean,
    attendance: {[index: string]: boolean},
    auxInfo: {[index: string]: any}
}