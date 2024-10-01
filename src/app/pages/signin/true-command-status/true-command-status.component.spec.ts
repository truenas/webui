import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import {
  TrueCommandStatusComponent,
} from 'app/pages/signin/true-command-status/true-command-status.component';
import { WebSocketService } from 'app/services/ws.service';

describe('TrueCommandStatusComponent', () => {
  let spectator: Spectator<TrueCommandStatusComponent>;
  const createComponent = createComponentFactory({
    component: TrueCommandStatusComponent,
    providers: [
      mockWebSocket([
        mockCall('truenas.managed_by_truecommand', true),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('makes a websocket call to check TrueCommand status', () => {
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('truenas.managed_by_truecommand');
  });

  it('shows Managed by Truecommand status', () => {
    expect(spectator.query('ix-icon')).toHaveAttribute('name', 'truecommand-logo-mark-color');
    expect(spectator.query('.truecommand-text')).toHaveExactText('Managed by TrueCommand');
  });
});
