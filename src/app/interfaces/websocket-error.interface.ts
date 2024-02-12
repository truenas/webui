import { ResponseErrorType } from 'app/enums/response-error-type.enum';
import { WebSocketErrorName } from 'app/enums/websocket-error-name.enum';

export interface WebSocketError {
  errname: WebSocketErrorName;
  error: number;
  extra: unknown;
  reason: string;
  trace: WebSocketErrorTrace;
  type: ResponseErrorType | null;
}

export interface WebSocketErrorTrace {
  class: string;
  formatted: string;
  frames: WebSocketTraceFrame[];
}

export interface WebSocketTraceFrame {
  argspec: string[];
  filename: string;
  line: string;
  lineno: number;
  locals: Record<string, string>;
  method: string;
}
