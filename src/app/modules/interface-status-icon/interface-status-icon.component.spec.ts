import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatTooltip } from '@angular/material/tooltip';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockDirective } from 'ng-mocks';
import { kb, Mb } from 'app/constants/bits.constant';
import { LinkState } from 'app/enums/network-interface.enum';
import { NetworkInterfaceUpdate } from 'app/interfaces/reporting.interface';
import {
  InterfaceStatusIconComponent,
} from 'app/modules/interface-status-icon/interface-status-icon.component';
import { IxIconTestingModule } from 'app/modules/ix-icon/ix-icon-testing.module';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';

describe('InterfaceStatusIconComponent', () => {
  let spectator: Spectator<InterfaceStatusIconComponent>;
  let icon: IxIconHarness;

  const createComponent = createComponentFactory({
    component: InterfaceStatusIconComponent,
    imports: [
      IxIconTestingModule,
    ],
    declarations: [
      MockDirective(MatTooltip),
    ],
  });

  async function setupTest(update: NetworkInterfaceUpdate): Promise<void> {
    spectator = createComponent({
      props: { update },
    });

    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    icon = await loader.getHarness(IxIconHarness);
  }

  describe('disabled', () => {
    it('shows disabled icon when link state is not Up', async () => {
      await setupTest({ link_state: LinkState.Down } as NetworkInterfaceUpdate);

      expect(await icon.getNamespace()).toBe('ix');
      expect(await icon.getName()).toBe('network_upload_download_disabled');
    });

    it('shows disabled icon when link state is not available', async () => {
      await setupTest({ } as NetworkInterfaceUpdate);
      expect(await icon.getNamespace()).toBe('ix');
      expect(await icon.getName()).toBe('network_upload_download_disabled');
    });
  });

  describe('enabled', () => {
    beforeEach(async () => {
      await setupTest({
        link_state: LinkState.Up,
        sent_bytes_rate: 100 * kb,
        received_bytes_rate: 30 * Mb,
      } as NetworkInterfaceUpdate);
      jest.spyOn(spectator.component, 'updateStateInfoIcon');
    });

    it('shows enabled icon when link state is Up', async () => {
      expect(await icon.getNamespace()).toBe('ix');
      expect(await icon.getName()).toBe('network_upload_download');
    });

    it('shows sent and received rate in icon tooltip', () => {
      const tooltip = spectator.query(MatTooltip);

      expect(tooltip.message).toBe('Received: 240 Mb/s Sent: 800 kb/s');
    });

    it('updates state icon to mark arrow or arrows as active on network traffic', () => {
      spectator.setInput('update', {
        link_state: LinkState.Up,
        sent_bytes_rate: 50 * kb,
        received_bytes_rate: 10 * Mb,
      });
      expect(spectator.component.updateStateInfoIcon).toHaveBeenCalledWith('sent');
      expect(spectator.component.updateStateInfoIcon).toHaveBeenCalledWith('received');
    });
  });
});
