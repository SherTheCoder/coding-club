export type Claim={id:string;session_date:string;slot:number;name:string;title:string;url:string;practice:string;prep:string;topic:string;difficulty:string;revision:number;updated_at:string};
export type Notice={id:string;recipient:string;title:string;body:string;session_date:string;claim_id:string|null;created_at:string;read:number};
export type ClubData={signedIn:boolean;profile:string|null;roster:{name:string}[];claims:Claim[];inbox:Notice[];solved:string[];practiced:Problem[];dates:string[]};
export type Problem={title:string;url:string;number?:number;difficulty:string;topic:string;pattern?:string;art?:string;prep:string;practice?:string;name?:string;session_date?:string};
