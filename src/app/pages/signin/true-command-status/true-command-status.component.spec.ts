import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  TrueCommandStatusComponent,
} from 'app/pages/signin/true-command-status/true-command-status.component';

describe('TrueCommandStatusComponent', () => {
  let spectator: Spectator<TrueCommandStatusComponent>;
  const createComponent = createComponentFactory({
    component: TrueCommandStatusComponent,
    providers: [
      mockApi([
        mockCall('truenas.managed_by_truecommand', true),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('makes a websocket call to check TrueCommand status', () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('truenas.managed_by_truecommand');
  });

  it('shows Managed by Truecommand status', () => {
    expect(spectator.query('ix-icon')).toHaveAttribute('name', 'ix-truecommand-logo-mark-color');
    expect(spectator.query('.truecommand-text')).toHaveExactText('Managed by TrueCommand');
  });
});
