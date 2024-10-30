import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { VirtualizationGlobalState } from 'app/enums/virtualization.enum';
import {
  GlobalConfigFormComponent,
} from 'app/pages/virtualization/components/all-instances/all-instances-header/global-config-form/global-config-form.component';
import { VirtualizationStateComponent } from 'app/pages/virtualization/components/all-instances/all-instances-header/virtualization-state/virtualization-state.component';
import { VirtualizationConfigStore } from 'app/pages/virtualization/stores/virtualization-config.store';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
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
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of(undefined)),
      }),
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

      const virtualizationStateComponent = spectator.query(VirtualizationStateComponent);
      expect(virtualizationStateComponent.state).toBe(VirtualizationGlobalState.NoPool);

      const selectPoolButton = await loader.getHarness(MatButtonHarness.with({ text: 'Select Pool' }));
      expect(selectPoolButton).toExist();
    });

    it('shows status, Global Settings and disabled Create New Instance for Initializing state', async () => {
      storeMock.virtualizationState.set(VirtualizationGlobalState.Initializing);
      spectator.detectChanges();

      expect((spectator.fixture.nativeElement as HTMLElement).children).toHaveLength(3);

      const virtualizationStateComponent = spectator.query(VirtualizationStateComponent);
      expect(virtualizationStateComponent.state).toBe(VirtualizationGlobalState.Initializing);

      const globalSettingsButton = await loader.getHarness(MatButtonHarness.with({ text: 'Global Settings' }));
      expect(globalSettingsButton).toExist();

      const createNewInstanceButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create New Instance' }));
      expect(await createNewInstanceButton.isDisabled()).toBe(true);
    });

    it('shows status, Global Settings and Create New Instance for Initialized state', async () => {
      storeMock.virtualizationState.set(VirtualizationGlobalState.Initialized);
      spectator.detectChanges();

      expect((spectator.fixture.nativeElement as HTMLElement).children).toHaveLength(3);

      const virtualizationStateComponent = spectator.query(VirtualizationStateComponent);
      expect(virtualizationStateComponent.state).toBe(VirtualizationGlobalState.Initialized);

      const globalSettingsButton = await loader.getHarness(MatButtonHarness.with({ text: 'Global Settings' }));
      expect(globalSettingsButton).toExist();

      const createNewInstanceButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create New Instance' }));
      expect(createNewInstanceButton).not.toBeDisabled();
      expect(await (await createNewInstanceButton.host()).getAttribute('href')).toBe('/virtualization/new');
    });

    it('shows status, Global Settings and Go To Dataset for Locked state', async () => {
      storeMock.virtualizationState.set(VirtualizationGlobalState.Locked);
      spectator.detectChanges();

      expect((spectator.fixture.nativeElement as HTMLElement).children).toHaveLength(3);

      const virtualizationStateComponent = spectator.query(VirtualizationStateComponent);
      expect(virtualizationStateComponent.state).toBe(VirtualizationGlobalState.Locked);

      const globalSettingsButton = await loader.getHarness(MatButtonHarness.with({ text: 'Global Settings' }));
      expect(globalSettingsButton).toExist();

      const goToDataset = await loader.getHarness(MatButtonHarness.with({ text: 'Go To Dataset' }));
      expect(goToDataset).toExist();
      expect(await (await goToDataset.host()).getAttribute('href')).toBe('/storage/datasets/pool1/dataset1');
    });

    it('shows status and Global Settings for Error state', async () => {
      storeMock.virtualizationState.set(VirtualizationGlobalState.Error);
      spectator.detectChanges();

      expect((spectator.fixture.nativeElement as HTMLElement).children).toHaveLength(2);

      const virtualizationStateComponent = spectator.query(VirtualizationStateComponent);
      expect(virtualizationStateComponent.state).toBe(VirtualizationGlobalState.Error);

      const globalSettingsButton = await loader.getHarness(MatButtonHarness.with({ text: 'Global Settings' }));
      expect(globalSettingsButton).toExist();
    });
  });

  describe('actions', () => {
    it('opens GlobalConfigFormComponent when Global Settings button is pressed', async () => {
      storeMock.virtualizationState.set(VirtualizationGlobalState.Initialized);
      spectator.detectChanges();

      const globalSettingsButton = await loader.getHarness(MatButtonHarness.with({ text: 'Global Settings' }));
      await globalSettingsButton.click();

      expect(spectator.inject(ChainedSlideInService).open).toHaveBeenCalledWith(
        GlobalConfigFormComponent,
        false,
        { dataset: 'pool1/dataset1' },
      );
    });
  });
});
