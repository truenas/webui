import { createServiceFactory, SpectatorService, mockProvider } from '@ngneat/spectator/jest';
import { Subject } from 'rxjs';
import { CoreService } from 'app/core/services/core-service/core.service';
import { CoreEvent } from 'app/interfaces/events';
import { WebSocketService } from 'app/services/ws.service';
import { DiskStateService } from './disk-state.service';

describe('DiskStateService', () => {
  let spectator: SpectatorService<DiskStateService>;
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
  });

  const createService = createServiceFactory({
    service: DiskStateService,
    providers: [coreService, websocketService],
    entryComponents: [],
  });

  /*
   * Test Methods
   * */

  beforeEach(() => {
    spectator = createService();
  });

  it('should instantiate', () => {
    expect(spectator).toBeTruthy();
  });

  test('should forward DisksChanged notifications', (done) => {
    let waiting = true;
    messageBus$.subscribe((evt: CoreEvent) => {
      try {
        if (waiting && evt.name == 'DisksChanged') {
          expect(evt.data).toBe('fake socket data');
          done();
          waiting = false;
        }
      } catch (error) {
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
