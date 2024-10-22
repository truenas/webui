import { ApiErrorName } from 'app/enums/api-error-name.enum';
import { ResponseErrorType } from 'app/enums/response-error-type.enum';

export interface ApiError {
  errname: ApiErrorName;
  error: number;
  extra: unknown;
  reason: string;
  trace: ApiErrorTrace;
  type: ResponseErrorType | null;
}

export interface ApiErrorTrace {
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
