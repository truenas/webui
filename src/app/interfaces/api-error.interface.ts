import { ApiErrorName } from 'app/enums/api.enum';

export interface ApiError {
  errname: ApiErrorName;
  error: number;
  extra: unknown;
  reason: string;
  trace: ApiErrorTrace;
  message?: string | null;
}

export interface ApiErrorTrace {
  class: string;
  formatted: string;
  frames: ApiTraceFrame[];
}

export interface ApiTraceFrame {
  argspec: string[];
  filename: string;
  line: string;
  lineno: number;
  locals: Record<string, string>;
  method: string;
}
