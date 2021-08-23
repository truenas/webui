import { ResponseErrorType } from 'app/enums/response-error-type.enum';

export interface ErrorResponse {
  error: number;
  extra: ApiValidationError[];
  reason: string;
  trace: {
    class: string;
    formatted: string;
    frames: ErrorFrame[];
  };
  type: ResponseErrorType | null;
}

export type ApiValidationError = [
  attribute: string,
  message: string,
  code: number,
];

export interface ErrorFrame {
  argspec: string[];
  filename: string;
  line: string;
  lineno: number;
  locals: { [name: string]: string };
  method: string;
}
