import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
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
      mockProvider(ContainersStore, {
        initialize: jest.fn(),
        containers: signal([]),
      }),
      mockProvider(ContainerConfigStore, storeMock),
      mockProvider(SlideIn, {
        open: jest.fn(() => of(undefined)),
      }),
      mockProvider(MatDialog, {
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
      const configButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configuration' }));
      expect(configButton).toExist();

      const createNewButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create New Container' }));
      expect(createNewButton).not.toBeDisabled();
    });

    it('opens ContainerFormComponent when Create New Container is pressed', async () => {
      const createNewButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create New Container' }));
      await createNewButton.click();

      expect(spectator.inject(SlideIn).open).toHaveBeenCalled();
    });

    it('shows Settings and Map User/Group IDs menu items', async () => {
      const configButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configuration' }));
      await configButton.click();

      const menu = await loader.getHarness(MatMenuHarness);
      const items = await menu.getItems();
      expect(items).toHaveLength(2);

      const itemTexts = await Promise.all(items.map((item) => item.getText()));
      expect(itemTexts).toEqual(['Settings', 'Map User/Group IDs']);
    });
  });

  describe('actions', () => {
    it('opens GlobalConfigFormComponent when Settings menu item is pressed', async () => {
      const configButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configuration' }));
      await configButton.click();

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.clickItem({ text: 'Settings' });

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
        GlobalConfigFormComponent,
        { data: { dataset: 'pool1/dataset1' } },
      );
      expect(spectator.inject(ContainerConfigStore).initialize).toHaveBeenCalled();
      expect(spectator.inject(ContainersStore).initialize).toHaveBeenCalled();
    });

    it('opens MapUserGroupIdsDialogComponent when Map User/Group IDs menu item is pressed', async () => {
      const configButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configuration' }));
      await configButton.click();

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.clickItem({ text: 'Map User/Group IDs' });

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
        MapUserGroupIdsDialogComponent,
        {
          width: '800px',
          panelClass: 'map-user-group-dialog',
        },
      );
    });
  });
});
