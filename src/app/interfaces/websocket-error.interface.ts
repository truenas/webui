import { WebsocketErrorType } from 'app/enums/websocket-error-type.enum';

export interface WebsocketError {
  error: number;
  extra: ValidationError[];
  reason: string;
  trace: {
    class: string;
    formatted: string;
    frames: ErrorFrame[];
  };
  type: WebsocketErrorType | null;
}

export type ValidationError = [
  /* attribute */ string,
  /* message */ string,
  /* code */ number,
];

export interface ErrorFrame {
  argspec: string[];
  filename: string;
  line: string;
  lineno: number;
  locals: { [name: string]: string };
  method: string;
}
