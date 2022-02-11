import { createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { CoreEvent } from 'app/interfaces/events';
import { CoreService } from 'app/services/core-service/core.service';
import { DiskStateService } from 'app/services/disk-state/disk-state.service';
import { WebSocketService } from 'app/services/ws.service';

describe('DiskStateService', () => {
  const messageBus$ = new Subject();
  const fakeSocket$ = new Subject();

  /*
   * Mocked Services
   * */
  const coreService = mockProvider(CoreService, {
    register: () => messageBus$,
    emit: (evt: CoreEvent) => messageBus$.next(evt),
  });

  const websocketService = mockProvider(WebSocketService, {
    sub: () => fakeSocket$,
    authStatus: of(),
  });

  const createService = createServiceFactory({
    service: DiskStateService,
    providers: [coreService, websocketService],
  });

  beforeEach(() => {
    createService();
  });

  test('should forward DisksChanged notifications', (done) => {
    let waiting = true;
    messageBus$.subscribe((evt: CoreEvent) => {
      try {
        if (waiting && evt.name === 'DisksChanged') {
          expect(evt.data).toBe('fake socket data');
          done();
          waiting = false;
        }
      } catch (error: unknown) {
        done(error);
      }
    });

    messageBus$.next({ name: 'Authenticated' });

    fakeSocket$.next('fake socket data');
  });

  afterAll(() => {
    messageBus$.complete();
    fakeSocket$.complete();
  });
});
