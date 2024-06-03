import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable, of } from 'rxjs';
import { MockEnclosureConfig } from 'app/core/testing/mock-enclosure/interfaces/mock-enclosure.interface';
import { MockStorageGenerator } from 'app/core/testing/mock-enclosure/mock-storage-generator.utils';
import { ApiCallMethod, ApiCallParams, ApiCallResponse } from 'app/interfaces/api/api-call-directory.interface';
import { WebSocketService } from 'app/services/ws.service';

@Injectable({
  providedIn: 'root',
})
export class MockEnclosureWebsocketService extends WebSocketService {
  private mockConfig: MockEnclosureConfig = environment.mockConfig;
  private mockStorage = new MockStorageGenerator(this.mockConfig);

  override call<M extends ApiCallMethod>(method: M, params?: ApiCallParams<M>): Observable<ApiCallResponse<M>> {
    if (this.canMockCall(method, params)) {
      const mockResultMessage = this.overrideMessage(method, params);
      return of(mockResultMessage);
    }

    return super.call(method, params);
  }

  private canMockCall<M extends ApiCallMethod>(method: ApiCallMethod, params?: ApiCallParams<M>): boolean {
    const mockedCall = this.overrideMessage(method, params);
    return mockedCall !== undefined;
  }

  private overrideMessage<M extends ApiCallMethod>(method: M, _?: ApiCallParams<M>): ApiCallResponse<M> | undefined {
    switch (method) {
      case 'webui.enclosure.dashboard':
        return this.mockStorage.webuiDashboardEnclosureResponse() ?? undefined;
      case 'truenas.is_ix_hardware':
        return true;
    }
    return undefined;
  }
}
