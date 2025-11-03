import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { ContainerStatus } from 'app/enums/container.enum';
import {
  InstanceToolsComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-tools/instance-tools.component';
import { fakeVirtualizationInstance } from 'app/pages/instances/utils/fake-virtualization-instance.utils';

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
        instance: fakeVirtualizationInstance({
          id: 1,
          status: {
            state: ContainerStatus.Running,
            pid: 123,
            domain_state: null,
          },
        }),
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('shell', () => {
    it('shows a link to shell', async () => {
      const shellLink = await loader.getHarness(MatButtonHarness.with({ text: 'Shell' }));

      expect(shellLink).toBeTruthy();
      expect(await (await shellLink.host()).getAttribute('href')).toBe('/containers/view/1/shell');
    });

    it('show shell link as disabled when instance is not running', async () => {
      spectator.setInput('instance', fakeVirtualizationInstance({
        id: 1,
        status: {
          state: ContainerStatus.Stopped,
          pid: null,
          domain_state: null,
        },
      }));

      const shellLink = await loader.getHarness(MatButtonHarness.with({ text: 'Shell' }));
      expect(await shellLink.isDisabled()).toBe(true);
    });
  });
});
