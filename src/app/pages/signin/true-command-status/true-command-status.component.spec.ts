import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import {
  TrueCommandStatusComponent,
} from 'app/pages/signin/true-command-status/true-command-status.component';

describe('TrueCommandStatusComponent', () => {
  let spectator: Spectator<TrueCommandStatusComponent>;
  const createComponent = createComponentFactory({
    component: TrueCommandStatusComponent,
    providers: [
      mockTypedApi([
        mockTypedCall('truenas.managed_by_truecommand', true),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('makes a websocket call to check TrueCommand status', () => {
    expect(spectator.inject(TypedApiService).callUnauthenticated).toHaveBeenCalledWith('truenas.managed_by_truecommand');
  });

  it('shows Managed by Truecommand status', async () => {
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    expect(spectator.query('tn-icon')).toHaveAttribute('name', 'tn-truecommand-logo-mark-color');
    expect(spectator.query('.truecommand-text')).toHaveExactText('Managed by TrueCommand');
  });
});
