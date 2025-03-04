import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { VirtualizationGlobalState } from 'app/enums/virtualization.enum';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import {
  GlobalConfigFormComponent,
} from 'app/pages/instances/components/all-instances/all-instances-header/global-config-form/global-config-form.component';
import {
  MapUserGroupIdsDialogComponent,
} from 'app/pages/instances/components/all-instances/all-instances-header/map-user-group-ids-dialog/map-user-group-ids-dialog.component';
import { VirtualizationStateComponent } from 'app/pages/instances/components/all-instances/all-instances-header/virtualization-state/virtualization-state.component';
import {
  VolumesDialogComponent,
} from 'app/pages/instances/components/common/volumes-dialog/volumes-dialog.component';
import { VirtualizationConfigStore } from 'app/pages/instances/stores/virtualization-config.store';
import { AllInstancesHeaderComponent } from './all-instances-header.component';

describe('AllInstancesHeaderComponent', () => {
  let spectator: Spectator<AllInstancesHeaderComponent>;
  let loader: HarnessLoader;
  const storeMock = {
    isLoading: signal(false),
    virtualizationState: signal(VirtualizationGlobalState.Initialized),
    config: signal({ dataset: 'pool1/dataset1' }),
  };

  const createComponent = createComponentFactory({
    component: AllInstancesHeaderComponent,
    declarations: [
      MockComponent(VirtualizationStateComponent),
    ],
    providers: [
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
    it('shows status and Select Pool button for NoPool state', async () => {
      storeMock.virtualizationState.set(VirtualizationGlobalState.NoPool);
      spectator.detectChanges();

      expect((spectator.fixture.nativeElement as HTMLElement).children).toHaveLength(2);

      const virtualizationStateComponent = spectator.query(VirtualizationStateComponent)!;
      expect(virtualizationStateComponent.state).toBe(VirtualizationGlobalState.NoPool);

      const selectPoolButton = await loader.getHarness(MatButtonHarness.with({ text: 'Select Pool' }));
      expect(selectPoolButton).toExist();
    });

    it('shows status, Settings button and disabled Create New Instance for Initializing state', async () => {
      storeMock.virtualizationState.set(VirtualizationGlobalState.Initializing);
      spectator.detectChanges();

      const virtualizationStateComponent = spectator.query(VirtualizationStateComponent)!;
      expect(virtualizationStateComponent.state).toBe(VirtualizationGlobalState.Initializing);

      const configurationButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configuration' }));
      expect(configurationButton).toExist();

      const createNewInstanceButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create New Instance' }));
      expect(await createNewInstanceButton.isDisabled()).toBe(true);
    });

    it('shows status, Configuration and Create New Instance for Initialized state', async () => {
      storeMock.virtualizationState.set(VirtualizationGlobalState.Initialized);
      spectator.detectChanges();

      const virtualizationStateComponent = spectator.query(VirtualizationStateComponent)!;
      expect(virtualizationStateComponent.state).toBe(VirtualizationGlobalState.Initialized);

      const configurationButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configuration' }));
      expect(configurationButton).toExist();

      const createNewInstanceButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create New Instance' }));
      expect(createNewInstanceButton).not.toBeDisabled();
      expect(await (await createNewInstanceButton.host()).getAttribute('href')).toBe('/instances/new');
    });

    it('shows status, Configuration and Go To Dataset for Locked state', async () => {
      storeMock.virtualizationState.set(VirtualizationGlobalState.Locked);
      spectator.detectChanges();

      const virtualizationStateComponent = spectator.query(VirtualizationStateComponent)!;
      expect(virtualizationStateComponent.state).toBe(VirtualizationGlobalState.Locked);

      const configurationButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configuration' }));
      expect(configurationButton).toExist();

      const goToDataset = await loader.getHarness(MatButtonHarness.with({ text: 'Go To Dataset' }));
      expect(goToDataset).toExist();
      expect(await (await goToDataset.host()).getAttribute('href')).toBe('/storage/datasets/pool1/dataset1');
    });

    it('shows status and Configuration for Error state', async () => {
      storeMock.virtualizationState.set(VirtualizationGlobalState.Error);
      spectator.detectChanges();

      const virtualizationStateComponent = spectator.query(VirtualizationStateComponent)!;
      expect(virtualizationStateComponent.state).toBe(VirtualizationGlobalState.Error);

      const configurationButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configuration' }));
      expect(configurationButton).toExist();
    });
  });

  describe('actions', () => {
    it('opens GlobalConfigFormComponent when Global Settings in Configuration menu is pressed', async () => {
      storeMock.virtualizationState.set(VirtualizationGlobalState.Initialized);
      spectator.detectChanges();

      const configurationMenu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Configuration' }));
      await configurationMenu.open();
      await configurationMenu.clickItem({ text: 'Global Settings' });

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
        GlobalConfigFormComponent,
        { data: { dataset: 'pool1/dataset1' } },
      );
    });

    it('opens VolumesDialogComponent when Manage Volumes in Configuration menu is pressed', async () => {
      storeMock.virtualizationState.set(VirtualizationGlobalState.Initialized);
      spectator.detectChanges();

      const configurationMenu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Configuration' }));
      await configurationMenu.open();
      await configurationMenu.clickItem({ text: 'Manage Volumes' });

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
        VolumesDialogComponent,
        expect.anything(),
      );
    });

    it('opens MapUserGroupIdsDialog when Map User/Group IDs is pressed', async () => {
      storeMock.virtualizationState.set(VirtualizationGlobalState.Initialized);
      spectator.detectChanges();

      const configurationMenu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Configuration' }));
      await configurationMenu.open();
      await configurationMenu.clickItem({ text: 'Map User/Group IDs' });

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
        MapUserGroupIdsDialogComponent,
        expect.anything(),
      );
    });
  });
});
