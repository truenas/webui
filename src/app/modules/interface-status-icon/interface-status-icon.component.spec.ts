import { MatTooltip } from '@angular/material/tooltip';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent, MockDirective } from 'ng-mocks';
import { kb, Mb } from 'app/constants/bits.constant';
import { LinkState } from 'app/enums/network-interface.enum';
import { NetworkInterfaceUpdate } from 'app/interfaces/reporting.interface';
import {
  InterfaceStatusIconComponent,
} from 'app/modules/interface-status-icon/interface-status-icon.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

describe('InterfaceStatusIconComponent', () => {
  let spectator: Spectator<InterfaceStatusIconComponent>;
  let icon: IxIconComponent;

  const createComponent = createComponentFactory({
    component: InterfaceStatusIconComponent,
    declarations: [
      MockComponent(IxIconComponent),
      MockDirective(MatTooltip),
    ],
  });

  function setupTest(update: NetworkInterfaceUpdate): void {
    spectator = createComponent({
      props: { update },
    });
    icon = spectator.query(IxIconComponent)!;
  }

  describe('disabled', () => {
    it('shows disabled icon when link state is not Up', () => {
      setupTest({ link_state: LinkState.Down } as NetworkInterfaceUpdate);

      expect(icon.name).toBe('ix-network-upload-download-disabled');
    });

    it('shows disabled icon when link state is not available', () => {
      setupTest({ } as NetworkInterfaceUpdate);

      expect(icon.name).toBe('ix-network-upload-download-disabled');
    });
  });

  describe('enabled', () => {
    beforeEach(() => {
      setupTest({
        link_state: LinkState.Up,
        sent_bytes_rate: 100 * kb,
        received_bytes_rate: 30 * Mb,
      } as NetworkInterfaceUpdate);
    });

    it('shows sent and received rate in icon tooltip', () => {
      const tooltip = spectator.query(MatTooltip)!;

      expect(tooltip.message).toBe('Received: 240 Mb/s Sent: 800 kb/s');
    });

    it('updates state icon depending on traffic', () => {
      setupTest({
        link_state: LinkState.Up,
        sent_bytes_rate: 100 * Mb,
        received_bytes_rate: 0,
      } as NetworkInterfaceUpdate);
      expect(icon.name).toBe('ix-network-upload-download-up');

      setupTest({
        link_state: LinkState.Up,
        sent_bytes_rate: 0,
        received_bytes_rate: 100 * Mb,
      } as NetworkInterfaceUpdate);
      expect(icon.name).toBe('ix-network-upload-download-down');

      setupTest({
        link_state: LinkState.Up,
        sent_bytes_rate: 0,
        received_bytes_rate: 0,
      } as NetworkInterfaceUpdate);
      expect(icon.name).toBe('ix-network-upload-download');

      setupTest({
        link_state: LinkState.Up,
        sent_bytes_rate: 100 * Mb,
        received_bytes_rate: 100 * Mb,
      } as NetworkInterfaceUpdate);
      expect(icon.name).toBe('ix-network-upload-download-both');
    });
  });
});
