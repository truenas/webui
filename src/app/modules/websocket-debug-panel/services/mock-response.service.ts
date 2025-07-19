import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { environment } from 'environments/environment';
import { Observable, Subject, timer } from 'rxjs';
import { first } from 'rxjs/operators';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import {
  CollectionUpdateMessage, IncomingMessage, RequestMessage, SuccessfulResponse,
} from 'app/interfaces/api-message.interface';
import {
  CallMockResponse, JobMockEvent, JobMockResponse, MockConfig,
} from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import { selectEnabledMockConfigs } from 'app/modules/websocket-debug-panel/store/websocket-debug.selectors';

interface MockResponse {
  config: MockConfig;
  jobId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class MockResponseService {
  private readonly mockResponses$ = new Subject<IncomingMessage>();
  private jobIdCounter = 10000;
  private readonly activeJobs = new Map<number, { requestId: string; method: string }>();

  get responses$(): Observable<IncomingMessage> {
    return this.mockResponses$.asObservable();
  }

  constructor(
    private store$: Store,
  ) {}

  checkMock(message: RequestMessage): MockResponse | null {
    if (!environment.debugPanel?.enabled) {
      return null;
    }

    let enabledMocks: MockConfig[] = [];
    this.store$.select(selectEnabledMockConfigs)
      .pipe(first())
      .subscribe((configs) => { enabledMocks = configs; });

    for (const config of enabledMocks) {
      if (this.matchesConfig(message, config)) {
        if (config.type === 'job') {
          const jobId = this.getNextJobId();
          this.activeJobs.set(jobId, { requestId: message.id, method: message.method });
          return { config, jobId };
        }
        return { config };
      }
    }

    return null;
  }

  generateMockResponse(message: RequestMessage, mockResponse: MockResponse): void {
    const { config, jobId } = mockResponse;

    if (config.type === 'call') {
      this.handleCallMock(message, config.response as CallMockResponse);
    } else if (config.type === 'job') {
      this.handleJobMock(message, config.response as JobMockResponse, jobId);
    }
  }

  private matchesConfig(message: RequestMessage, config: MockConfig): boolean {
    if (message.method !== config.methodName) {
      return false;
    }

    if (config.messagePattern) {
      try {
        const regex = new RegExp(config.messagePattern);
        const messageStr = JSON.stringify(message);
        return regex.test(messageStr);
      } catch (error) {
        console.error('Invalid regex pattern:', config.messagePattern, error);
        return false;
      }
    }

    return true;
  }

  private handleCallMock(message: RequestMessage, response: CallMockResponse): void {
    const mockResponse: SuccessfulResponse = {
      jsonrpc: '2.0',
      id: message.id,
      result: response.result,
    };
    this.mockResponses$.next(mockResponse);
  }

  private handleJobMock(message: RequestMessage, response: JobMockResponse, jobId: number): void {
    const jobResponse: SuccessfulResponse = {
      jsonrpc: '2.0',
      id: message.id,
      result: jobId,
    };
    this.mockResponses$.next(jobResponse);

    let totalDelay = 0;
    response.events.forEach((event) => {
      totalDelay += event.delay || environment.debugPanel?.mockJobDefaultDelay || 2000;
      timer(totalDelay).subscribe(() => {
        this.emitJobEvent(jobId, message.method as ApiJobMethod, event);
      });
    });
  }

  private emitJobEvent(jobId: number, method: ApiJobMethod, event: JobMockEvent): void {
    const updateMessage: CollectionUpdateMessage = {
      jsonrpc: '2.0',
      method: 'collection_update',
      params: {
        collection: `core.job_update.${method}` as ApiJobMethod,
        fields: {
          ...event.fields,
          id: jobId,
        },
        id: jobId,
        msg: CollectionChangeType.Changed,
      },
    };
    this.mockResponses$.next(updateMessage);

    if (event.fields.state === 'SUCCESS' || event.fields.state === 'FAILED') {
      this.activeJobs.delete(jobId);
    }
  }

  private getNextJobId(): number {
    return ++this.jobIdCounter;
  }

  getActiveJobs(): Map<number, { requestId: string; method: string }> {
    return new Map(this.activeJobs);
  }

  isJobActive(jobId: number): boolean {
    return this.activeJobs.has(jobId);
  }
}
