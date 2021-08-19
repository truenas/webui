export interface NtpServer {
  address: string;
  burst: boolean;
  iburst: boolean;
  id: number;
  maxpoll: number;
  minpoll: number;
  prefer: boolean;
}

export interface CreateNtpServer {
  address: string;
  burst?: boolean;
  force?: boolean;
  iburst?: boolean;
  maxpoll: number;
  minpoll: number;
  prefer?: boolean;
}
