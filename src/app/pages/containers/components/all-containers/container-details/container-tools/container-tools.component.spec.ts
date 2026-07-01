import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnIconHarness } from '@truenas/ui-components';
import { MockAuthService } from 'app/core/testing/classes/mock-auth.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerStatus } from 'app/enums/container.enum';
import { Role } from 'app/enums/role.enum';
import { Container } from 'app/interfaces/container.interface';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import {
  ContainerToolsComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-tools/container-tools.component';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { fakeContainer } from 'app/pages/containers/utils/fake-container.utils';

describe('ContainerToolsComponent', () => {
  let spectator: Spectator<ContainerToolsComponent>;
  let loader: HarnessLoader;
  const selectedContainer = signal<Container>(fakeContainer({
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
      mockProvider(ContainersStore, { selectedContainer }),
      mockAuth(),
    ],
  });

  const denyWebShellAccess = (): void => {
    spectator.inject(MockAuthService).setUser({
      privilege: {
        roles: { $set: [Role.FullAdmin] },
        web_shell: false,
      },
    } as LoggedInUser);
    spectator.detectChanges();
  };

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

    it('locks the Shell row with a lock icon when the user lacks web_shell access', async () => {
      denyWebShellAccess();

      const icon = await loader.getHarness(TnIconHarness);
      expect(await icon.getName()).toBe('lock');
    });

    it('disables the Shell link when the user lacks web_shell access', async () => {
      denyWebShellAccess();

      const shellLink = await loader.getHarness(MatButtonHarness.with({ text: 'Shell' }));
      expect(await shellLink.isDisabled()).toBe(true);
    });
  });
});
