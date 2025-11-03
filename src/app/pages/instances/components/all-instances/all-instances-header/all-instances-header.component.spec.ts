import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import {
  GlobalConfigFormComponent,
} from 'app/pages/instances/components/all-instances/all-instances-header/global-config-form/global-config-form.component';
import { VirtualizationConfigStore } from 'app/pages/instances/stores/virtualization-config.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';
import { AllInstancesHeaderComponent } from './all-instances-header.component';

describe('AllInstancesHeaderComponent', () => {
  let spectator: Spectator<AllInstancesHeaderComponent>;
  let loader: HarnessLoader;
  const storeMock = {
    isLoading: signal(false),
    config: signal({ dataset: 'pool1/dataset1' }),
    initialize: jest.fn(),
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
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('elements visibility', () => {
    it('shows Settings and Create New Container buttons', async () => {
      const settingsButton = await loader.getHarness(MatButtonHarness.with({ text: 'Settings' }));
      expect(settingsButton).toExist();

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
    it('opens GlobalConfigFormComponent when Settings button is pressed', async () => {
      const settingsButton = await loader.getHarness(MatButtonHarness.with({ text: 'Settings' }));
      await settingsButton.click();

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
        GlobalConfigFormComponent,
        { data: { dataset: 'pool1/dataset1' } },
      );
      expect(spectator.inject(VirtualizationConfigStore).initialize).toHaveBeenCalled();
      expect(spectator.inject(VirtualizationInstancesStore).initialize).toHaveBeenCalled();
    });
  });
});
