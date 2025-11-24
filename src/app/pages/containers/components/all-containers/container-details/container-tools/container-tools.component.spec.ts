import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ContainerStatus } from 'app/enums/container.enum';
import { ContainerInstance } from 'app/interfaces/container.interface';
import {
  ContainerToolsComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-tools/container-tools.component';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { fakeContainer } from 'app/pages/containers/utils/fake-container.utils';

describe('ContainerToolsComponent', () => {
  let spectator: Spectator<ContainerToolsComponent>;
  let loader: HarnessLoader;
  const selectedContainer = signal<ContainerInstance>(fakeContainer({
    id: 1,
    status: {
      state: ContainerStatus.Running,
      pid: 123,
      domain_state: null,
    },
  }));

  const createComponent = createComponentFactory({
    component: ContainerToolsComponent,
    providers: [
      mockProvider(ContainersStore, {
        selectedContainer,
      }),
    ],
  });

  beforeEach(() => {
    selectedContainer.set(fakeContainer({
      id: 1,
      status: {
        state: ContainerStatus.Running,
        pid: 123,
        domain_state: null,
      },
    }));
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('shell', () => {
    it('shows a link to shell', async () => {
      const shellLink = await loader.getHarness(MatButtonHarness.with({ text: 'Shell' }));

      expect(shellLink).toBeTruthy();
      expect(await (await shellLink.host()).getAttribute('href')).toBe('/containers/view/1/shell');
    });

    it('show shell link as disabled when container is not running', async () => {
      selectedContainer.set(fakeContainer({
        id: 1,
        status: {
          state: ContainerStatus.Stopped,
          pid: null,
          domain_state: null,
        },
      }));
      spectator.detectChanges();

      const shellLink = await loader.getHarness(MatButtonHarness.with({ text: 'Shell' }));
      expect(await shellLink.isDisabled()).toBe(true);
    });
  });
});
