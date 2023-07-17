import { ResponseErrorType } from 'app/enums/response-error-type.enum';

export interface WebsocketError {
  errname: string;
  error: number;
  extra: unknown;
  reason: string;
  trace: WebsocketErrorTrace;
  type: ResponseErrorType | null;
}

export interface WebsocketErrorTrace {
  class: string;
  formatted: string;
  frames: WebsocketTraceFrame[];
}

export interface WebsocketTraceFrame {
  argspec: string[];
  filename: string;
  line: string;
  lineno: number;
  locals: Record<string, string>;
  method: string;
}
