import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { ReconnectMessage } from 'app/pages/signin/reconnect-message/reconnect-message.component';

describe('ReconnectMessage', () => {
  let spectator: Spectator<ReconnectMessage>;

  const createComponent = createComponentFactory({
    component: ReconnectMessage,
    imports: [
      MockComponent(FakeProgressBarComponent),
    ],
    providers: [
      mockProvider(WebSocketHandlerService, {
        reconnect: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('checks the message', () => {
    const text = spectator.query('.reconnect-message');
    expect(text).toHaveText('The connection to TrueNAS was lost due to a timeout or network interruption. To continue, please reconnect manually.');
  });

  it('checks reconnect button click', () => {
    spectator.click('button');
    expect(spectator.inject(WebSocketHandlerService).reconnect).toHaveBeenCalled();
  });
});
