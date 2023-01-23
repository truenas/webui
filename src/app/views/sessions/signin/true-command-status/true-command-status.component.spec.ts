import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket2 } from 'app/core/testing/utils/mock-websocket.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { WINDOW } from 'app/helpers/window.helper';
import { TrueCommandConnectionState } from 'app/interfaces/true-command-config.interface';
import { DialogService, WebSocketService2 } from 'app/services';
import {
  TrueCommandStatusComponent,
} from 'app/views/sessions/signin/true-command-status/true-command-status.component';

describe('TrueCommandStatusComponent', () => {
  let spectator: Spectator<TrueCommandStatusComponent>;
  const createComponent = createComponentFactory({
    component: TrueCommandStatusComponent,
    providers: [
      mockWebsocket2([
        mockCall('truecommand.connected', {
          connected: true,
          truecommand_url: 'https://truecommand.example.com',
          truecommand_ip: '76.23.122.9',
        } as TrueCommandConnectionState),
      ]),
      mockProvider(DialogService, {
        generalDialog: jest.fn(() => of(true)),
      }),
      mockWindow({
        open: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('loads TrueCommand status and shows TrueCommand IP if it is connected', () => {
    expect(spectator.inject(WebSocketService2).call).toHaveBeenCalledWith('truecommand.connected');

    expect(spectator.query('.truecommand')).toExist();
    expect(spectator.query('.truecommand')).toHaveExactText('TrueCommand IP: 76.23.122.9');
  });

  it('opens TrueCommand URL when status string is clicked', () => {
    spectator.click('.truecommand');

    expect(spectator.inject(DialogService).generalDialog).toHaveBeenCalled();
    expect(spectator.inject<Window>(WINDOW).open).toHaveBeenCalledWith('https://truecommand.example.com');
  });
});
