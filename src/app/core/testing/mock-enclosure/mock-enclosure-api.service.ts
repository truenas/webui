import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { MockEnclosureConfig } from 'app/core/testing/mock-enclosure/interfaces/mock-enclosure.interface';
import { MockEnclosureGenerator } from 'app/core/testing/mock-enclosure/mock-enclosure-generator.utils';
import { ApiCallMethod, ApiCallParams, ApiCallResponse } from 'app/interfaces/api/api-call-directory.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { ApiService } from 'app/services/websocket/api.service';
import { SubscriptionManagerService } from 'app/services/websocket/subscription-manager.service';
import { WebSocketHandlerService } from 'app/services/websocket/websocket-handler.service';

@Injectable({
  providedIn: 'root',
})
export class MockEnclosureApiService extends ApiService {
  private mockConfig: MockEnclosureConfig = environment.mockConfig;
  private mockStorage = new MockEnclosureGenerator(this.mockConfig);

  constructor(
    wsManager: WebSocketHandlerService,
    subscriptionManager: SubscriptionManagerService,
    translate: TranslateService,
  ) {
    super(wsManager, subscriptionManager, translate);

    console.warn('MockEnclosureApiService is in effect. Some calls will be mocked');
  }

  override call<M extends ApiCallMethod>(method: M, params?: ApiCallParams<M>): Observable<ApiCallResponse<M>> {
    const preOverride = this.preCallOverride(method, params);
    if (preOverride !== undefined) {
      return of(preOverride);
    }

    return super.call(method, params).pipe(
      map((realResponse) => {
        const postOverride = this.postCallOverride(method, realResponse);
        return postOverride ?? realResponse;
      }),
    );
  }

  private preCallOverride<M extends ApiCallMethod>(method: M, _?: ApiCallParams<M>): ApiCallResponse<M> | undefined {
    switch (method) {
      case 'webui.enclosure.dashboard':
        return this.mockStorage.webuiDashboardEnclosureResponse() ?? undefined;
      case 'truenas.is_ix_hardware':
        return true;
      default:
        return undefined;
    }
  }

  private postCallOverride<M extends ApiCallMethod>(method: M, response: ApiCallResponse<M>): ApiCallResponse<M> {
    switch (method) {
      case 'webui.main.dashboard.sys_info':
      case 'system.info':
        return this.mockStorage.enhanceSystemInfoResponse(response as SystemInfo);
      default:
        return undefined;
    }
  }
}
