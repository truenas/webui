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
} from 'app/pages/instances/components/all-instances/all-instances-header/global-config-form/global-config-form.component';
import {
  MapUserGroupIdsDialog,
} from 'app/pages/instances/components/all-instances/all-instances-header/map-user-group-ids-dialog/map-user-group-ids-dialog.component';
import {
  VolumesDialog,
} from 'app/pages/instances/components/common/volumes-dialog/volumes-dialog.component';
import { VirtualizationConfigStore } from 'app/pages/instances/stores/virtualization-config.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';
import { AllInstancesHeaderComponent } from './all-instances-header.component';

describe('AllInstancesHeaderComponent', () => {
  let spectator: Spectator<AllInstancesHeaderComponent>;
  let loader: HarnessLoader;
  const storeMock = {
    isLoading: signal(false),
    config: signal({ dataset: 'pool1/dataset1' }),
  };

  const createComponent = createComponentFactory({
    component: AllInstancesHeaderComponent,
    providers: [
      mockAuth(),
      mockProvider(VirtualizationInstancesStore, {
        initialize: jest.fn(),
        instances: signal([]),
      }),
      mockProvider(VirtualizationConfigStore, storeMock),
      mockProvider(SlideIn, {
        open: jest.fn(() => of(undefined)),
      }),
      mockProvider(MatDialog),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('elements visibility', () => {
    it('shows Configuration and Create New Container buttons', async () => {
      const configurationButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configuration' }));
      expect(configurationButton).toExist();

      const createNewButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create New Container' }));
      expect(createNewButton).not.toBeDisabled();
    });

    it('opens InstanceFormComponent when Create New Container is pressed', async () => {
      const createNewButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create New Container' }));
      await createNewButton.click();

      expect(spectator.inject(SlideIn).open).toHaveBeenCalled();
    });
  });

  describe('actions', () => {
    it('opens GlobalConfigFormComponent when Global Settings in Configuration menu is pressed', async () => {
      const configurationMenu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Configuration' }));
      await configurationMenu.open();
      await configurationMenu.clickItem({ text: 'Global Settings' });

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
        GlobalConfigFormComponent,
        { data: { dataset: 'pool1/dataset1' } },
      );
      expect(spectator.inject(VirtualizationInstancesStore).initialize).toHaveBeenCalled();
    });

    it('opens VolumesDialogComponent when Manage Volumes in Configuration menu is pressed', async () => {
      const configurationMenu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Configuration' }));
      await configurationMenu.open();
      await configurationMenu.clickItem({ text: 'Manage Volumes' });

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
        VolumesDialog,
        expect.anything(),
      );
    });

    it('opens MapUserGroupIdsDialog when Map User/Group IDs is pressed', async () => {
      const configurationMenu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Configuration' }));
      await configurationMenu.open();
      await configurationMenu.clickItem({ text: 'Map User/Group IDs' });

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
        MapUserGroupIdsDialog,
        expect.anything(),
      );
    });
  });
});
