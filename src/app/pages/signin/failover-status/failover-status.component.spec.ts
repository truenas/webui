import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { FailoverStatusComponent } from 'app/pages/signin/failover-status/failover-status.component';

describe('FailoverStatusComponent', () => {
  let spectator: Spectator<FailoverStatusComponent>;
  const createComponent = createComponentFactory({
    component: FailoverStatusComponent,
    imports: [MapValuePipe],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        status: FailoverStatus.Master,
        disabledReasons: [],
        failoverIps: ['117.231.23.3', '84.3.12.48'],
      },
    });
  });

  it('shows "HA is enabled" when failover is enabled', () => {
    expect(spectator.query('.failover-status-message')).toHaveText('HA is enabled.');
  });

  it('shows failover status', () => {
    expect(spectator.query('.failover-status')).toHaveText('Active TrueNAS Controller.');
  });

  it('shows Checking HA status if failover status is not yet known', () => {
    spectator.setInput({ disabledReasons: undefined });
    expect(spectator.query('.failover-status-message')).toHaveText('Checking HA status');
  });

  it('shows HA is reconnecting when disabledReasons only has NoSystemReady', () => {
    spectator.setInput({ disabledReasons: [FailoverDisabledReason.NoSystemReady] });
    expect(spectator.query('.failover-status-message')).toHaveText('HA is reconnecting.');
  });

  it('shows HA is disabled when disabledReasons only has NoFailover', () => {
    spectator.setInput({ disabledReasons: [FailoverDisabledReason.NoFailover] });
    expect(spectator.query('.failover-status-message')).toHaveText('HA is administratively disabled.');
  });

  it('shows failover disabled reasons when failover is disabled', () => {
    spectator.setInput({
      disabledReasons: [
        FailoverDisabledReason.NoLicense,
        FailoverDisabledReason.NoPong,
      ],
    });
    expect(spectator.query('.failover-status-message')).toHaveText('HA is in a faulted state');
    expect(spectator.query('.failover-reasons')).toHaveText('Other TrueNAS controller has no license.');
    expect(spectator.query('.failover-reasons')).toHaveText('Other TrueNAS controller cannot be reached.');
  });

  it('shows failover IPs if they are present', () => {
    expect(spectator.query('.failover-ips')).toHaveText('Active IP Addresses: 117.231.23.3, 84.3.12.48');
  });
});
