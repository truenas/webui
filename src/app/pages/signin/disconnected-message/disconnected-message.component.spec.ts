import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import {
  DisconnectedMessageComponent,
} from 'app/pages/signin/disconnected-message/disconnected-message.component';

describe('DisconnectedMessageComponent', () => {
  let spectator: Spectator<DisconnectedMessageComponent>;
  const createComponent = createComponentFactory({
    component: DisconnectedMessageComponent,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows "Connecting to TrueNAS" message', () => {
    expect(spectator.fixture.nativeElement).toHaveText('Connecting to TrueNAS');
    expect(spectator.fixture.nativeElement).toHaveText('Make sure the TrueNAS system is powered on and connected to the network.');
  });
});
