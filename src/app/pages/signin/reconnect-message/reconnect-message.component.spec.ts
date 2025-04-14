import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { BehaviorSubject } from 'rxjs';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { ReconnectMessage } from 'app/pages/signin/reconnect-message/reconnect-message.component';

describe('ReconnectMessage', () => {
  let spectator: Spectator<ReconnectMessage>;
  const isClosed$ = new BehaviorSubject(true);

  const createComponent = createComponentFactory({
    component: ReconnectMessage,
    providers: [
      mockProvider(WebSocketHandlerService, {
        reconnect: jest.fn(),
        isClosed$,
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('checks reconnect button click', () => {
    spectator.click('button');
    expect(spectator.inject(WebSocketHandlerService).reconnect).toHaveBeenCalled();
  });
});
