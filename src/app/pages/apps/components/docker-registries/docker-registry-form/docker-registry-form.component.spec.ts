import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { dockerHubRegistry } from 'app/interfaces/docker-registry.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { DockerRegistryFormComponent } from 'app/pages/apps/components/docker-registries/docker-registry-form/docker-registry-form.component';

describe('DockerRegistryFormComponent', () => {
  let spectator: Spectator<DockerRegistryFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const mockRegistry = {
    id: 1,
    uri: dockerHubRegistry,
    name: 'Old Registry',
    username: 'old_user',
    password: '',
  };

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  const createComponent = createComponentFactory({
    component: DockerRegistryFormComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockApi([
        mockCall('app.registry.create'),
        mockCall('app.registry.update'),
      ]),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(DialogService),
      mockProvider(FormErrorHandlerService),
      mockAuth(),
    ],
  });

  describe('creating a Docker registry', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('initializes the form with default values for Docker Hub as a URI and submits with default values', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        URI: 'Docker Hub',
        Username: '',
        Password: '',
      });

      await form.fillForm({
        Username: 'admin',
        Password: 'password',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('app.registry.create', [
        {
          uri: dockerHubRegistry,
          name: 'Docker Hub',
          username: 'admin',
          password: 'password',
        },
      ]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });

    it('sends a create payload and closes the modal when the save button is clicked', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        URI: 'Other Registry',
      });

      await form.fillForm({
        URI: 'https://ghcr.io/',
        Name: 'New GHCR Registry',
        Username: 'admin',
        Password: 'password',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('app.registry.create', [
        {
          uri: 'https://ghcr.io/',
          name: 'New GHCR Registry',
          username: 'admin',
          password: 'password',
        },
      ]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('editing a Docker registry', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            ...slideInRef,
            getData: jest.fn(() => {
              return { registry: mockRegistry };
            }),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('populates the form with existing registry values', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        URI: dockerHubRegistry,
        Name: 'Old Registry',
        Username: 'old_user',
        Password: '',
      });

      const uriSelector = await loader.getHarnessOrNull(IxSelectHarness.with({ label: 'URI' }));
      expect(uriSelector).toBeNull();
    });

    it('sends an update payload and closes the modal when the save button is clicked', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        URI: dockerHubRegistry,
        Name: 'Updated Registry',
        Username: 'updated_user',
        Password: 'updated_password',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('app.registry.update', [
        1,
        {
          uri: dockerHubRegistry,
          name: 'Updated Registry',
          username: 'updated_user',
          password: 'updated_password',
        },
      ]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('when user is logged in to Docker Hub', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            ...slideInRef,
            getData: jest.fn(() => {
              return { isLoggedInToDockerHub: true };
            }),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('initializes the form with empty string and does not show URI ix-select', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        URI: '',
        Name: '',
        Username: '',
        Password: '',
      });

      const uriSelector = await loader.getHarnessOrNull(IxSelectHarness.with({ label: 'URI' }));
      expect(uriSelector).toBeNull();
    });
  });
});
