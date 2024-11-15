import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { VirtualizationStatus } from 'app/enums/virtualization.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import {
  InstanceToolsComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-tools/instance-tools.component';

describe('InstanceToolsComponent', () => {
  let spectator: Spectator<InstanceToolsComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: InstanceToolsComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        instance: {
          id: 'my-instance',
          status: VirtualizationStatus.Running,
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
});
