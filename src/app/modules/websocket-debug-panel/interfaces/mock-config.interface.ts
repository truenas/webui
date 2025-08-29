export interface MockConfig {
  id: string;
  enabled: boolean;
  methodName: string;
  messagePattern?: string;
  response: MockResponse;
  events?: MockEvent[];
}

export type MockResponse = MockSuccessResponse | MockErrorResponse;

export interface MockSuccessResponse {
  type: 'success';
  result: unknown;
  delay?: number;
}

export interface MockErrorResponse {
  type: 'error';
  error: {
    code: number; // Allow any number for flexibility in mocking
    message: string;
    data?: unknown; // Support CallError structure or any other data
  };
  delay?: number;
}

// CallError specific data structure (matches ApiErrorDetails)
export interface CallErrorData {
  errname?: string; // e.g., 'EINVAL', 'EACCES'
  error?: number; // Error code
  reason?: string; // Human-readable reason
  extra?: unknown; // Additional error details (often validation errors)
  trace?: {
    class: string;
    formatted: string;
    frames: {
      argspec: string[];
      filename: string;
      line: string;
      lineno: number;
      locals: Record<string, string>;
      method: string;
    }[];
  };
  message?: string | null;
}

// Type guards for MockResponse types
export function isSuccessResponse(response: MockResponse): response is MockSuccessResponse {
  return response.type === 'success';
}

export function isErrorResponse(response: MockResponse): response is MockErrorResponse {
  return response.type === 'error';
}

export function isCallErrorData(data: unknown): data is CallErrorData {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return 'errname' in obj || 'reason' in obj || 'extra' in obj;
}

export interface MockEvent {
  delay: number;
  fields: {
    id?: number;
    message_ids?: string[];
    method?: string;
    arguments?: unknown[];
    transient?: boolean;
    description?: string | null;
    abortable?: boolean;
    logs_path?: string | null;
    logs_excerpt?: string | null;
    progress?: {
      percent: number;
      description: string;
      extra?: unknown;
    };
    result?: unknown;
    result_encoding_error?: unknown;
    error?: string | null;
    exception?: string | null;
    exc_info?: unknown;
    state: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'ABORTED' | 'WAITING';
    time_started?: { $date: number };
    time_finished?: { $date: number } | null;
    credentials?: unknown;
  };
}
