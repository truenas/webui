import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { VirtualizationStatus, VirtualizationType } from 'app/enums/virtualization.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import {
  InstanceToolsComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-tools/instance-tools.component';

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
      expect(await (await shellLink.host()).getAttribute('href')).toBe('/instances/view/my-instance/shell');
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

  describe('console', () => {
    it('shows a link to console for VMs', async () => {
      const consoleLink = await loader.getHarness(MatButtonHarness.with({ text: 'Serial Console' }));

      expect(consoleLink).toBeTruthy();
      expect(await (await consoleLink.host()).getAttribute('href')).toBe('/instances/view/my-instance/console');
    });
  });

  describe('vnc', () => {
    it('shows a link to  VNC', async () => {
      const vncLink = await loader.getHarness(MatButtonHarness.with({ selector: '[ixTest="open-vnc"]' }));
      expect(vncLink).toBeTruthy();

      expect(await (await vncLink.host()).getAttribute('href')).toBe('vnc://truenas.com:5900');
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
