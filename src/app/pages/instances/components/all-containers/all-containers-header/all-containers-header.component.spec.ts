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
} from 'app/pages/instances/components/all-containers/all-containers-header/global-config-form/global-config-form.component';
import { ContainerConfigStore } from 'app/pages/instances/stores/container-config.store';
import { ContainerInstancesStore } from 'app/pages/instances/stores/container-instances.store';
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
      mockProvider(ContainerInstancesStore, {
        initialize: jest.fn(),
        instances: signal([]),
      }),
      mockProvider(ContainerConfigStore, storeMock),
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

    it('opens ContainerFormComponent when Create New Container is pressed', async () => {
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
      expect(spectator.inject(ContainerConfigStore).initialize).toHaveBeenCalled();
      expect(spectator.inject(ContainerInstancesStore).initialize).toHaveBeenCalled();
    });
  });
});
