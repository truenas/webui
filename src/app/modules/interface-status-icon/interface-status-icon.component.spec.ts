import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnIconHarness, TnTooltipDirective } from '@truenas/ui-components';
import { kb, Mb } from 'app/constants/bits.constant';
import { LinkState } from 'app/enums/network-interface.enum';
import { NetworkInterfaceReport } from 'app/interfaces/reporting.interface';
import {
  InterfaceStatusIconComponent,
} from 'app/modules/interface-status-icon/interface-status-icon.component';

describe('InterfaceStatusIconComponent', () => {
  let spectator: Spectator<InterfaceStatusIconComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: InterfaceStatusIconComponent,
  });

  function setupTest(update: NetworkInterfaceReport): void {
    spectator = createComponent({
      props: { update },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  describe('disabled', () => {
    it('shows disabled icon when link state is not Up', async () => {
      setupTest({ link_state: LinkState.Down } as NetworkInterfaceReport);

      const icon = await loader.getHarness(TnIconHarness);
      expect(await icon.getName()).toBe('tn-network-upload-download-disabled');
    });

    it('shows disabled icon when link state is not available', async () => {
      setupTest({ } as NetworkInterfaceReport);

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
      } as NetworkInterfaceReport);
    });

    it('shows sent and received rate in icon tooltip', () => {
      const tooltip = spectator.query(TnTooltipDirective)!;

      expect(tooltip.message).toBe('Received: 240 Mb/s Sent: 800 kb/s');
    });

    it('updates state icon depending on traffic', async () => {
      setupTest({
        link_state: LinkState.Up,
        sent_bytes_rate: 100 * Mb,
        received_bytes_rate: 0,
      } as NetworkInterfaceReport);
      let icon = await loader.getHarness(TnIconHarness);
      expect(await icon.getName()).toBe('tn-network-upload-download-up');

      setupTest({
        link_state: LinkState.Up,
        sent_bytes_rate: 0,
        received_bytes_rate: 100 * Mb,
      } as NetworkInterfaceReport);
      icon = await loader.getHarness(TnIconHarness);
      expect(await icon.getName()).toBe('tn-network-upload-download-down');

      setupTest({
        link_state: LinkState.Up,
        sent_bytes_rate: 0,
        received_bytes_rate: 0,
      } as NetworkInterfaceReport);
      icon = await loader.getHarness(TnIconHarness);
      expect(await icon.getName()).toBe('tn-network-upload-download');

      setupTest({
        link_state: LinkState.Up,
        sent_bytes_rate: 100 * Mb,
        received_bytes_rate: 100 * Mb,
      } as NetworkInterfaceReport);
      icon = await loader.getHarness(TnIconHarness);
      expect(await icon.getName()).toBe('tn-network-upload-download-both');
    });
  });
});
