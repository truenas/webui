import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { VirtualizationStatus, VirtualizationType } from 'app/enums/virtualization.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import {
  InstanceToolsComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-tools/instance-tools.component';

describe('InstanceToolsComponent', () => {
  let spectator: Spectator<InstanceToolsComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: InstanceToolsComponent,
    providers: [
      mockWindow({
        location: {
          hostname: 'truenas.com',
        },
        open: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        instance: {
          id: 'my-instance',
          status: VirtualizationStatus.Running,
          type: VirtualizationType.Vm,
          vnc_enabled: true,
          vnc_port: 5900,
        } as VirtualizationInstance,
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('shell', () => {
    it('shows a link to shell', async () => {
      const shellLink = await loader.getHarness(MatButtonHarness.with({ text: 'Shell' }));

      expect(shellLink).toBeTruthy();
      expect(await (await shellLink.host()).getAttribute('href')).toBe('/virtualization/view/my-instance/shell');
    });

    it('show shell link as disabled when instance is not running', async () => {
      spectator.setInput('instance', {
        id: 'my-instance',
        status: VirtualizationStatus.Stopped,
      } as VirtualizationInstance);

      const shellLink = await loader.getHarness(MatButtonHarness.with({ text: 'Shell' }));
      expect(await shellLink.isDisabled()).toBe(true);
    });
  });

  describe('vnc', () => {
    it('opens VNC when when VNC link is pressed', async () => {
      const vncLink = await loader.getHarness(MatButtonHarness.with({ selector: '[ixTest="open-vnc"]' }));
      expect(vncLink).toBeTruthy();

      await vncLink.click();
      expect(spectator.inject<Window>(WINDOW).open).toHaveBeenCalledWith('vnc://truenas.com:5900', '_blank');
    });

    it('shows vnc link as disabled when instance is not running', async () => {
      spectator.setInput('instance', {
        id: 'my-instance',
        status: VirtualizationStatus.Stopped,
        type: VirtualizationType.Vm,
        vnc_enabled: true,
        vnc_port: 5900,
      } as VirtualizationInstance);

      const vncLink = await loader.getHarness(MatButtonHarness.with({ selector: '[ixTest="open-vnc"]' }));
      expect(await vncLink.isDisabled()).toBe(true);
    });

    it('hides vnc link when vnc is not enabled', async () => {
      spectator.setInput('instance', {
        id: 'my-instance',
        status: VirtualizationStatus.Stopped,
        type: VirtualizationType.Vm,
        vnc_enabled: false,
        vnc_port: 5900,
      } as VirtualizationInstance);

      const vncLink = await loader.getHarnessOrNull(MatButtonHarness.with({ selector: '[ixTest="open-vnc"]' }));
      expect(vncLink).toBeNull();
    });
  });
});
