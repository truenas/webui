import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import { filter, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import { ApiErrorName } from 'app/enums/api-error-name.enum';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { ResponseErrorType } from 'app/enums/response-error-type.enum';
import { ApiCallMethod, ApiCallParams, ApiCallResponse } from 'app/interfaces/api/api-call-directory.interface';
import { ApiJobMethod, ApiJobParams } from 'app/interfaces/api/api-job-directory.interface';
import { ApiError } from 'app/interfaces/api-error.interface';
import { IncomingApiMessage, ResultMessage } from 'app/interfaces/api-message.interface';
import { WebSocketHandlerService } from 'app/services/websocket-handler.service';

@Injectable({
  providedIn: 'root',
})
export class ApiMethodService {
  private get ws$(): Observable<unknown> {
    return this.wsHandler.wsConnection.websocket$.pipe(
      tap((response: IncomingApiMessage) => {
        if (this.hasAuthError(response)) {
          console.error(response);
          this.wsHandler.wsConnection.close();
        }
      }),
    );
  }

  constructor(
    private wsHandler: WebSocketHandlerService,
    private translate: TranslateService,
  ) {}

  private hasAuthError(data: IncomingApiMessage): boolean {
    return 'error' in data && data.error.error === 207;
  }

  call<M extends ApiCallMethod>(method: M, params?: ApiCallParams<M>): Observable<ApiCallResponse<M>>;
  call<M extends ApiJobMethod>(method: M, params?: ApiJobParams<M>): Observable<number>;
  call<M extends ApiCallMethod | ApiJobMethod>(method: M, params?: unknown): Observable<unknown> {
    const uuid = UUID.UUID();
    return of(uuid).pipe(
      tap(() => {
        performance.mark(`${method} - ${uuid} - start`);
        this.wsHandler.wsConnection.send({
          id: uuid, msg: IncomingApiMessageType.Method, method, params,
        });
      }),
      switchMap(() => this.ws$),
      switchMap((data: IncomingApiMessage) => {
        if ('error' in data && data.error) {
          this.printError(data.error, { method, params });
          const error = this.enhanceError(data.error, { method });
          return throwError(() => error);
        }

        performance.mark(`${method} - ${uuid} - end`);
        performance.measure(method, `${method} - ${uuid} - start`, `${method} - ${uuid} - end`);
        return of(data);
      }),
      filter((data: IncomingApiMessage) => data.msg === IncomingApiMessageType.Result && data.id === uuid),
      map((data: ResultMessage) => data.result),
      take(1),
    );
  }

  private printError(error: ApiError, context: { method: string; params: unknown }): void {
    if (error.errname === ApiErrorName.NoAccess) {
      console.error(`Access denied to ${context.method} with ${context.params ? JSON.stringify(context.params) : 'no params'}`);
      return;
    }

    // Do not log validation errors.
    if (error.type === ResponseErrorType.Validation) {
      return;
    }

    console.error('Error: ', error);
  }

  // TODO: Probably doesn't belong here. Consider building something similar to interceptors.
  private enhanceError(error: ApiError, context: { method: string }): ApiError {
    if (error.errname === ApiErrorName.NoAccess) {
      return {
        ...error,
        reason: this.translate.instant('Access denied to {method}', { method: context.method }),
      };
    }

    return error;
  }
}
