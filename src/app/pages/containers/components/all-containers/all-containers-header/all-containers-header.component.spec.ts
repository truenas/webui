import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnMenuHarness, TnMenuTesting, TnDialog,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import {
  GlobalConfigFormComponent,
} from 'app/pages/containers/components/all-containers/all-containers-header/global-config-form/global-config-form.component';
import {
  MapUserGroupIdsDialogComponent,
} from 'app/pages/containers/components/all-containers/all-containers-header/map-user-group-ids-dialog/map-user-group-ids-dialog.component';
import { ContainerConfigStore } from 'app/pages/containers/stores/container-config.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { AllContainersHeaderComponent } from './all-containers-header.component';

describe('AllContainersHeaderComponent', () => {
  let spectator: Spectator<AllContainersHeaderComponent>;
  let loader: HarnessLoader;
  const storeMock = {
    isLoading: signal(false),
    config: signal({ dataset: 'pool1/dataset1' }),
    initialize: jest.fn(),
  };

  const createComponent = createComponentFactory({
    component: AllContainersHeaderComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('lxc.config', {
          bridge: 'bridge1',
          v4_network: '1.2.3.4/24',
          v6_network: null,
          preferred_pool: 'tank',
        }),
        mockCall('lxc.bridge_choices', { '[AUTO]': 'Automatic', bridge1: 'bridge1' }),
        mockCall('container.pool_choices', { tank: 'tank' }),
        mockCall('lxc.update'),
      ]),
      mockProvider(ContainersStore, {
        initialize: jest.fn(),
        containers: signal([]),
      }),
      mockProvider(ContainerConfigStore, storeMock),
      mockProvider(SlideIn, {
        open: jest.fn(() => of(undefined)),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('elements visibility', () => {
    it('shows Configuration menu and Create New Container buttons', async () => {
      const configButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configuration' }));
      expect(configButton).toExist();

      const createNewButton = await loader.getHarness(TnButtonHarness.with({ label: 'Create New Container' }));
      expect(await createNewButton.isDisabled()).toBe(false);
    });

    it('opens ContainerFormComponent when Create New Container is pressed', async () => {
      const createNewButton = await loader.getHarness(TnButtonHarness.with({ label: 'Create New Container' }));
      await createNewButton.click();

      expect(spectator.inject(SlideIn).open).toHaveBeenCalled();
    });

    it('shows Settings and Map User/Group IDs menu items', async () => {
      const configButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configuration' }));
      await configButton.click();

      const menu = await TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
      expect(await menu.getItemLabels()).toEqual(['Settings', 'Map User/Group IDs']);
    });
  });

  describe('actions', () => {
    it('opens the global config side panel when Settings menu item is pressed', async () => {
      const configButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configuration' }));
      await configButton.click();

      const menu = await TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
      await menu.clickItem({ label: 'Settings' });
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(spectator.query('ix-global-config-form', { root: true })).toBeTruthy();
    });

    it('reinitializes stores when the config form reports a successful save', async () => {
      const configButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configuration' }));
      await configButton.click();

      const menu = await TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
      await menu.clickItem({ label: 'Settings' });
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const configForm = spectator.query(GlobalConfigFormComponent, { root: true });
      configForm!.closed.emit(true);
      spectator.detectChanges();

      expect(spectator.inject(ContainerConfigStore).initialize).toHaveBeenCalled();
      expect(spectator.inject(ContainersStore).initialize).toHaveBeenCalled();
    });

    it('opens MapUserGroupIdsDialogComponent when Map User/Group IDs menu item is pressed', async () => {
      const configButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configuration' }));
      await configButton.click();

      const menu = await TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
      await menu.clickItem({ label: 'Map User/Group IDs' });

      expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(
        MapUserGroupIdsDialogComponent,
        {
          width: '800px',
          panelClass: 'map-user-group-dialog',
        },
      );
    });

    it('submits the config form via the side panel Save action', async () => {
      const configButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configuration' }));
      await configButton.click();

      const menu = await TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
      await menu.clickItem({ label: 'Settings' });
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const configForm = spectator.query(GlobalConfigFormComponent, { root: true });
      expect(configForm).toBeInstanceOf(GlobalConfigFormComponent);

      const submitSpy = jest.spyOn(configForm!, 'submit');
      const saveButton = await TnMenuTesting.rootLoader(spectator.fixture)
        .getHarness(TnButtonHarness.with({ label: 'Save' }));
      await saveButton.click();

      expect(submitSpy).toHaveBeenCalled();
    });
  });
});
