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
    data?: unknown;
  };
  delay?: number;
}

// Type guards for MockResponse types
export function isSuccessResponse(response: MockResponse): response is MockSuccessResponse {
  return response.type === 'success';
}

export function isErrorResponse(response: MockResponse): response is MockErrorResponse {
  return response.type === 'error';
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
