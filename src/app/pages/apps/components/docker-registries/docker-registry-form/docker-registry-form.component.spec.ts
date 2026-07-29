import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import {
  TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DockerRegistry, dockerHubRegistry } from 'app/interfaces/docker-registry.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
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
  } as DockerRegistry;

  const createComponent = createComponentFactory({
    component: DockerRegistryFormComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockApi([
        mockCall('app.registry.create'),
        mockCall('app.registry.update'),
      ]),
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
      const uriSelect = await loader.getHarness(TnSelectHarness);
      expect(await uriSelect.getDisplayText()).toBe('Docker Hub');
      expect(await (await loader.getHarness(TnInputHarness.with({ name: 'username' }))).getValue()).toBe('');
      expect(await (await loader.getHarness(TnInputHarness.with({ name: 'password' }))).getValue()).toBe('');

      await (await loader.getHarness(TnInputHarness.with({ name: 'username' }))).setValue('admin');
      await (await loader.getHarness(TnInputHarness.with({ name: 'password' }))).setValue('password');

      const closeSpy = jest.spyOn(spectator.component.closed, 'emit');
      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('app.registry.create', [
        {
          uri: dockerHubRegistry,
          name: 'Docker Hub',
          username: 'admin',
          password: 'password',
        },
      ]);
      expect(closeSpy).toHaveBeenCalledWith(true);
    });

    it('sends a create payload and closes the modal when the save button is clicked', async () => {
      const uriSelect = await loader.getHarness(TnSelectHarness);
      await uriSelect.selectOption('Other Registry');

      await (await loader.getHarness(TnInputHarness.with({ name: 'uri' }))).setValue('https://ghcr.io/');
      await (await loader.getHarness(TnInputHarness.with({ name: 'name' }))).setValue('New GHCR Registry');
      await (await loader.getHarness(TnInputHarness.with({ name: 'username' }))).setValue('admin');
      await (await loader.getHarness(TnInputHarness.with({ name: 'password' }))).setValue('password');

      const closeSpy = jest.spyOn(spectator.component.closed, 'emit');
      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('app.registry.create', [
        {
          uri: 'https://ghcr.io/',
          name: 'New GHCR Registry',
          username: 'admin',
          password: 'password',
        },
      ]);
      expect(closeSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('editing a Docker registry', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: { registry: mockRegistry },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('populates the form with existing registry values', async () => {
      expect(await (await loader.getHarness(TnInputHarness.with({ name: 'uri' }))).getValue()).toBe(dockerHubRegistry);
      expect(await (await loader.getHarness(TnInputHarness.with({ name: 'name' }))).getValue()).toBe('Old Registry');
      expect(await (await loader.getHarness(TnInputHarness.with({ name: 'username' }))).getValue()).toBe('old_user');
      expect(await (await loader.getHarness(TnInputHarness.with({ name: 'password' }))).getValue()).toBe('');

      const uriSelector = await loader.getHarnessOrNull(TnSelectHarness);
      expect(uriSelector).toBeNull();
    });

    it('sends an update payload and closes the modal when the save button is clicked', async () => {
      await (await loader.getHarness(TnInputHarness.with({ name: 'uri' }))).setValue(dockerHubRegistry);
      await (await loader.getHarness(TnInputHarness.with({ name: 'name' }))).setValue('Updated Registry');
      await (await loader.getHarness(TnInputHarness.with({ name: 'username' }))).setValue('updated_user');
      await (await loader.getHarness(TnInputHarness.with({ name: 'password' }))).setValue('updated_password');

      const closeSpy = jest.spyOn(spectator.component.closed, 'emit');
      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('app.registry.update', [
        1,
        {
          uri: dockerHubRegistry,
          name: 'Updated Registry',
          username: 'updated_user',
          password: 'updated_password',
        },
      ]);
      expect(closeSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('when user is logged in to Docker Hub', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: { isLoggedInToDockerHub: true },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('initializes the form with empty string and does not show URI select', async () => {
      expect(await (await loader.getHarness(TnInputHarness.with({ name: 'uri' }))).getValue()).toBe('');
      expect(await (await loader.getHarness(TnInputHarness.with({ name: 'name' }))).getValue()).toBe('');
      expect(await (await loader.getHarness(TnInputHarness.with({ name: 'username' }))).getValue()).toBe('');
      expect(await (await loader.getHarness(TnInputHarness.with({ name: 'password' }))).getValue()).toBe('');

      const uriSelector = await loader.getHarnessOrNull(TnSelectHarness);
      expect(uriSelector).toBeNull();
    });
  });
});
