import { ApiErrorName } from 'app/enums/api.enum';

/**
 * The TrueNAS payload in a JSON-RPC error's `data` (`format_truenas_error` in middleware's `rpc.py`).
 * The client's `TrueNasErrorData` matches it but for `errname`, which the client types as a string.
 *
 * `extra` is wider than the client says: a `CallError` raised with a dict (cloud sync's `excerpt`)
 * is sent with that dict.
 */
export interface ApiErrorDetails {
  errname: ApiErrorName;
  error: number;
  extra: unknown;
  reason: string;
  trace: ApiErrorTrace | null;
  message?: string | null;
}

export interface ApiErrorTrace {
  class: string;
  formatted: string;
  repr: string;
}
