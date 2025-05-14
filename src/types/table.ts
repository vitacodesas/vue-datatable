
export type THeaderTable = {
    label:string,
    displayName:string
}

export type TOrder = 'ASC' | 'DESC'

export type TSortBy = {
    column?: string;
    order?: TOrder;
}

export type TParamsRequest = {
    url: string, 
    page: number, 
    filter: object, 
    limit: number, 
    query: string, 
    searchBy: object, 
    sortBy?: TSortBy[]
}

export type Params = {
    limit: number;
    sortBy: TSortBy[];
    searchBy: object;
    page: number;
    query: string;
}