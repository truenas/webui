export interface MockConfig {
  id: string;
  enabled: boolean;
  methodName: string;
  messagePattern?: string;
  type: 'call' | 'job';
  response: CallMockResponse | JobMockResponse;
}

export interface CallMockResponse {
  result: unknown;
}

export interface JobMockResponse {
  events: JobMockEvent[];
}

export interface JobMockEvent {
  delay: number;
  fields: {
    description: string;
    progress: {
      percent: number;
      description: string;
    };
    result?: unknown;
    state: 'RUNNING' | 'SUCCESS' | 'FAILED';
  };
}
