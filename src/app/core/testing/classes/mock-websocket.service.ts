import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { when } from 'jest-when';
import { ApiDirectory, ApiMethod } from 'app/interfaces/api-directory.interface';
import { WebSocketService } from 'app/services';

/**
 * MockWebsocketService can be used to update websocket mocks on the fly
 *
 * @example
 * providers: [
 *   mockWebsocket({
 *     'filesystem.stat': of({ gid: 0 } as FileSystemStat),
 *   }),
 * ];
 *
 * ...
 * // In test case:
 * const websocketService = spectator.inject(MockWebsocketService);
 * websocketService.mockCallOnce('filesystem.stat', of({ gid: 5 } as FileSystemStat);
 */
@Injectable()
export class MockWebsocketService extends WebSocketService {
  constructor(
    private router: Router,
  ) {
    super(router);

    this.call = jest.fn();
    when(this.call).mockImplementation((method: ApiMethod, args: unknown[]) => {
      fail(`Unmocked websocket call ${method} with ${JSON.stringify(args)}`);
    });
  }
  mockCall<K extends ApiMethod>(method: K, response: ApiDirectory[K]['params']): void {
    when(this.call).calledWith(method, expect.anything()).mockReturnValue(response);
  }

  mockCallOnce<K extends ApiMethod>(method: K, response: ApiDirectory[K]['params']): void {
    when(this.call).calledWith(method, expect.anything()).mockReturnValueOnce(response);
  }

  onclose(): void {
    // Noop to avoid calling redirect.
  }
}
