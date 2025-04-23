import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { ReconnectMessage } from 'app/pages/signin/reconnect-message/reconnect-message.component';

describe('ReconnectMessage', () => {
  let spectator: Spectator<ReconnectMessage>;
  let loader: HarnessLoader;

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
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks truenas logo', () => {
    const logo = spectator.query(IxIconComponent);
    expect(logo).toExist();
  });

  it('checks text', () => {
    const text = spectator.query('.reconnect-message');
    expect(text).toHaveText('TrueNAS connection has timed out or was interrupted. To continue, press Reconnect.');
  });

  it('checks button click', async () => {
    const reconnectButton = await loader.getHarness(MatButtonHarness.with({ text: 'Reconnect' }));
    await reconnectButton.click();

    expect(spectator.inject(WebSocketHandlerService).reconnect).toHaveBeenCalled();
  });
});
