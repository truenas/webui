import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnMenuHarness, TnMenuTesting, TnDialog,
} from '@truenas/ui-components';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import {
  GlobalConfigFormComponent,
} from 'app/pages/containers/components/all-containers/all-containers-header/global-config-form/global-config-form.component';
import {
  MapUserGroupIdsDialogComponent,
} from 'app/pages/containers/components/all-containers/all-containers-header/map-user-group-ids-dialog/map-user-group-ids-dialog.component';
import { ContainerFormComponent } from 'app/pages/containers/components/container-form/container-form.component';
import { ContainerConfigStore } from 'app/pages/containers/stores/container-config.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { AllContainersHeaderComponent } from './all-containers-header.component';

describe('AllContainersHeaderComponent', () => {
  let spectator: Spectator<AllContainersHeaderComponent>;
  let loader: HarnessLoader;
  let formPanel: FormSidePanelService;
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
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.cancel()),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    formPanel = spectator.inject(FormSidePanelService);
  });

  describe('elements visibility', () => {
    it('shows Configuration menu and Create New Container buttons', async () => {
      const configButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configuration' }));
      expect(configButton).toExist();

      const createNewButton = await loader.getHarness(TnButtonHarness.with({ label: 'Create New Container' }));
      expect(await createNewButton.isDisabled()).toBe(false);
    });

    it('opens ContainerFormComponent in a side panel when Create New Container is pressed', async () => {
      const createNewButton = await loader.getHarness(TnButtonHarness.with({ label: 'Create New Container' }));
      await createNewButton.click();

      expect(formPanel.open).toHaveBeenCalledWith(
        ContainerFormComponent,
        expect.objectContaining({ title: 'Add Container' }),
      );
    });

    it('shows Settings and Map User/Group IDs menu items', async () => {
      const configButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configuration' }));
      await configButton.click();

      const menu = await TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
      expect(await menu.getItemLabels()).toEqual(['Settings', 'Map User/Group IDs']);
    });
  });

  describe('actions', () => {
    it('opens the global config form in a side panel when Settings menu item is pressed', async () => {
      const configButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configuration' }));
      await configButton.click();

      const menu = await TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
      await menu.clickItem({ label: 'Settings' });

      expect(formPanel.open).toHaveBeenCalledWith(GlobalConfigFormComponent, {
        title: 'Global Configuration',
      });
    });

    it('reinitializes stores when the config form reports a successful save', async () => {
      jest.spyOn(formPanel, 'open').mockReturnValue(SlideInResult.success(true));

      const configButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configuration' }));
      await configButton.click();

      const menu = await TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
      await menu.clickItem({ label: 'Settings' });

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
  });
});
