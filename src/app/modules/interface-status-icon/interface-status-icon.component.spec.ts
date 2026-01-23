import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatTooltip } from '@angular/material/tooltip';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnIconHarness } from '@truenas/ui-components';
import { MockDirective } from 'ng-mocks';
import { kb, Mb } from 'app/constants/bits.constant';
import { LinkState } from 'app/enums/network-interface.enum';
import { NetworkInterfaceUpdate } from 'app/interfaces/reporting.interface';
import {
  InterfaceStatusIconComponent,
} from 'app/modules/interface-status-icon/interface-status-icon.component';

describe('InterfaceStatusIconComponent', () => {
  let spectator: Spectator<InterfaceStatusIconComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: InterfaceStatusIconComponent,
    declarations: [
      MockDirective(MatTooltip),
    ],
  });

  function setupTest(update: NetworkInterfaceUpdate): void {
    spectator = createComponent({
      props: { update },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  describe('disabled', () => {
    it('shows disabled icon when link state is not Up', async () => {
      setupTest({ link_state: LinkState.Down } as NetworkInterfaceUpdate);

      const icon = await loader.getHarness(TnIconHarness);
      expect(await icon.getName()).toBe('tn-network-upload-download-disabled');
    });

    it('shows disabled icon when link state is not available', async () => {
      setupTest({ } as NetworkInterfaceUpdate);

      const icon = await loader.getHarness(TnIconHarness);
      expect(await icon.getName()).toBe('tn-network-upload-download-disabled');
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

    it('updates state icon depending on traffic', async () => {
      setupTest({
        link_state: LinkState.Up,
        sent_bytes_rate: 100 * Mb,
        received_bytes_rate: 0,
      } as NetworkInterfaceUpdate);
      let icon = await loader.getHarness(TnIconHarness);
      expect(await icon.getName()).toBe('tn-network-upload-download-up');

      setupTest({
        link_state: LinkState.Up,
        sent_bytes_rate: 0,
        received_bytes_rate: 100 * Mb,
      } as NetworkInterfaceUpdate);
      icon = await loader.getHarness(TnIconHarness);
      expect(await icon.getName()).toBe('tn-network-upload-download-down');

      setupTest({
        link_state: LinkState.Up,
        sent_bytes_rate: 0,
        received_bytes_rate: 0,
      } as NetworkInterfaceUpdate);
      icon = await loader.getHarness(TnIconHarness);
      expect(await icon.getName()).toBe('tn-network-upload-download');

      setupTest({
        link_state: LinkState.Up,
        sent_bytes_rate: 100 * Mb,
        received_bytes_rate: 100 * Mb,
      } as NetworkInterfaceUpdate);
      icon = await loader.getHarness(TnIconHarness);
      expect(await icon.getName()).toBe('tn-network-upload-download-both');
    });
  });
});
