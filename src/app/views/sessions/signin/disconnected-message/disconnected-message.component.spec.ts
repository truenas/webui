import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import {
  DisconnectedMessageComponent,
} from 'app/views/sessions/signin/disconnected-message/disconnected-message.component';

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

  it('shows "Waiting for controller" message when hasFailover is true', () => {
    spectator.setInput('hasFailover', true);

    expect(spectator.fixture.nativeElement).toHaveText('Waiting for Active TrueNAS controller to come up...');
  });
});
