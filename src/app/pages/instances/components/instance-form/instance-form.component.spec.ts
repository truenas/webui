import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { VirtualizationStatus } from 'app/enums/virtualization.enum';
import { ContainerInstance } from 'app/interfaces/container.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { InstanceFormComponent } from 'app/pages/instances/components/instance-form/instance-form.component';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';

describe('InstanceFormComponent', () => {
  let spectator: Spectator<InstanceFormComponent>;
  let loader: HarnessLoader;

  beforeAll(() => {
    Object.defineProperty(global, 'crypto', {
      value: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        randomUUID: () => 'test-uuid-456',
      },
    });
  });

  const existingInstance: ContainerInstance = {
    id: 1,
    uuid: 'test-uuid-123',
    name: 'test-container',
    description: 'Test description',
    vcpus: 2,
    cores: 1,
    threads: 1,
    cpuset: '0-1',
    memory: 1024,
    autostart: true,
    time: 'local',
    shutdown_timeout: 30,
    dataset: 'pool1/containers/test-container',
    init: '/sbin/init',
    initdir: '/root',
    initenv: { TEST: 'value' },
    inituser: 'root',
    initgroup: 'root',
    idmap: { type: 'none' },
    capabilities_policy: 'DEFAULT',
    capabilities_state: {},
    status: {
      state: VirtualizationStatus.Running,
      pid: 1234,
      domain_state: null,
    },
  };

  const createdInstance: ContainerInstance = {
    ...existingInstance,
    id: 1,
    name: 'new-container',
  };

  const createComponent = createComponentFactory({
    component: InstanceFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('container.pool_choices', { pool1: 'pool1', pool2: 'pool2' }),
        mockCall('lxc.config', {
          bridge: 'lxdbr0',
          v4_network: null,
          v6_network: null,
          preferred_pool: 'pool1',
        }),
        mockJob('container.create', fakeSuccessfulJob(createdInstance)),
        mockCall('container.update', existingInstance),
        mockCall('container.get_instance', existingInstance),
        mockCall('lxc.bridge_choices', { lxdbr0: 'lxdbr0' }),
        mockCall('container.query', []),
      ]),
      mockProvider(SlideInRef, {
        getData: jest.fn(() => undefined as ContainerInstance | undefined),
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(),
      }),
      mockProvider(VirtualizationInstancesStore, {
        initialize: jest.fn(),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of({
            name: 'ubuntu',
            version: '22.04',
          }),
        })),
      }),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of({ result: createdInstance }),
        })),
      }),
      mockProvider(Router, {
        navigate: jest.fn(),
      }),
      mockProvider(SnackbarService, {
        success: jest.fn(),
      }),
    ],
  });

  describe('creating new container', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows form title "Add Container"', () => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      const title = spectator.component['title']();
      expect(title).toBe('Add Container');
    });

    it('shows Virtual CPUs field in basic view', async () => {
      const vcpusInput = await loader.getHarness(IxInputHarness.with({ label: 'Virtual CPUs' }));
      expect(vcpusInput).toBeTruthy();
    });

    it('shows Memory field in basic view', async () => {
      const memoryInput = await loader.getHarness(IxInputHarness.with({ label: 'Memory Size (MB)' }));
      expect(memoryInput).toBeTruthy();
    });

    it('sets isAdvancedMode to false by default', () => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      expect(spectator.component['isAdvancedMode']).toBe(false);
    });

    it('toggles isAdvancedMode when Advanced Options is clicked', async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      // eslint-disable-next-line @typescript-eslint/dot-notation
      expect(spectator.component['isAdvancedMode']).toBe(true);

      const basicButton = await loader.getHarness(MatButtonHarness.with({ text: 'Basic Options' }));
      await basicButton.click();

      // eslint-disable-next-line @typescript-eslint/dot-notation
      expect(spectator.component['isAdvancedMode']).toBe(false);
    });

    it('shows Browse Catalog button for image selection', async () => {
      const browseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Browse Catalog' }));
      expect(browseButton).toBeTruthy();
    });

    it('opens image selection dialog when Browse Catalog is clicked', async () => {
      const browseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Browse Catalog' }));
      await browseButton.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalled();
    });
  });

  describe('editing existing container', () => {
    const createEditComponent = createComponentFactory({
      component: InstanceFormComponent,
      imports: [
        ReactiveFormsModule,
      ],
      providers: [
        mockAuth(),
        mockApi([
          mockCall('container.pool_choices', { pool1: 'pool1', pool2: 'pool2' }),
          mockCall('lxc.config', {
            bridge: 'lxdbr0',
            v4_network: null,
            v6_network: null,
            preferred_pool: 'pool1',
          }),
          mockCall('container.create'),
          mockCall('container.update', existingInstance),
          mockCall('container.get_instance', existingInstance),
          mockCall('lxc.bridge_choices', { lxdbr0: 'lxdbr0' }),
          mockCall('container.query', []),
        ]),
        mockProvider(SlideInRef, {
          getData: jest.fn(() => existingInstance as ContainerInstance | undefined),
          close: jest.fn(),
          requireConfirmationWhen: jest.fn(),
        }),
        mockProvider(VirtualizationInstancesStore, {
          initialize: jest.fn(),
        }),
        mockProvider(MatDialog, {
          open: jest.fn(() => ({
            afterClosed: () => of({
              name: 'ubuntu',
              version: '22.04',
            }),
          })),
        }),
        mockProvider(DialogService),
        mockProvider(Router),
      ],
    });

    beforeEach(() => {
      spectator = createEditComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows form title with container name', () => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      const title = spectator.component['title']();
      expect(title).toContain('test-container');
    });

    it('sets isEditMode to true', () => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      expect(spectator.component['isEditMode']()).toBe(true);
    });

    it('does not show pool field when editing', () => {
      const poolField = spectator.query('ix-select[formcontrolname="pool"]');
      expect(poolField).toBeNull();
    });

    it('does not show image field when editing', () => {
      const imageField = spectator.query('.image-field');
      expect(imageField).toBeNull();
    });

    it('shows Virtual CPUs field populated with existing value', async () => {
      const vcpusInput = await loader.getHarness(IxInputHarness.with({ label: 'Virtual CPUs' }));
      expect(await vcpusInput.getValue()).toBe('2');
    });

    it('shows Memory field populated with existing value', async () => {
      const memoryInput = await loader.getHarness(IxInputHarness.with({ label: 'Memory Size (MB)' }));
      expect(await memoryInput.getValue()).toBe('1024');
    });

    it('shows Save button instead of Create button', async () => {
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(saveButton).toBeTruthy();
    });
  });

  describe('form structure', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('has Virtual CPUs field visible in basic view', async () => {
      const vcpusInput = await loader.getHarness(IxInputHarness.with({ label: 'Virtual CPUs' }));
      expect(vcpusInput).toBeTruthy();
    });

    it('hides advanced CPU fields (Cores, Threads, CPU Set) in basic view', async () => {
      await expect(
        loader.getHarness(IxInputHarness.with({ label: 'Cores' })),
      ).rejects.toThrow();
      await expect(
        loader.getHarness(IxInputHarness.with({ label: 'Threads' })),
      ).rejects.toThrow();
      await expect(
        loader.getHarness(IxInputHarness.with({ label: 'CPU Set' })),
      ).rejects.toThrow();
    });

    it('shows advanced CPU fields in Advanced Settings', async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      const coresInput = await loader.getHarness(IxInputHarness.with({ label: 'Cores' }));
      const threadsInput = await loader.getHarness(IxInputHarness.with({ label: 'Threads' }));
      const cpusetInput = await loader.getHarness(IxInputHarness.with({ label: 'CPU Set' }));

      expect(coresInput).toBeTruthy();
      expect(threadsInput).toBeTruthy();
      expect(cpusetInput).toBeTruthy();
    });

    it('has Memory field visible by default', async () => {
      const memoryInput = await loader.getHarness(IxInputHarness.with({ label: 'Memory Size (MB)' }));
      expect(memoryInput).toBeTruthy();
    });
  });

  describe('creating a container', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('submits create job with correct payload when form is submitted', async () => {
      const dialogService = spectator.inject(DialogService);
      const router = spectator.inject(Router);
      const snackbar = spectator.inject(SnackbarService);
      const slideInRef = spectator.inject(SlideInRef);
      const instancesStore = spectator.inject(VirtualizationInstancesStore);

      const nameInput = await loader.getHarness(IxInputHarness.with({ label: 'Name' }));
      await nameInput.setValue('new-container');

      const descriptionInput = await loader.getHarness(IxInputHarness.with({ label: 'Description' }));
      await descriptionInput.setValue('Test container');

      const vcpusInput = await loader.getHarness(IxInputHarness.with({ label: 'Virtual CPUs' }));
      await vcpusInput.setValue('4');

      const memoryInput = await loader.getHarness(IxInputHarness.with({ label: 'Memory Size (MB)' }));
      await memoryInput.setValue('2048');

      const autostartCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Autostart' }));
      await autostartCheckbox.setValue(false);

      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['form'].patchValue({
        pool: 'pool1',
        image: 'ubuntu:22.04',
      });
      spectator.detectChanges();

      const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create' }));
      expect(await submitButton.isDisabled()).toBe(false);

      await submitButton.click();

      expect(dialogService.jobDialog).toHaveBeenCalled();
      const jobDialogCall = (dialogService.jobDialog as jest.Mock).mock.calls[0];
      expect(jobDialogCall[1]).toEqual({ title: 'Creating Container' });

      expect(snackbar.success).toHaveBeenCalledWith('Container created');
      expect(slideInRef.close).toHaveBeenCalledWith({ response: true, error: false });
      expect(instancesStore.initialize).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/containers', 'view', 1]);
    });
  });

  describe('updating a container', () => {
    const createEditComponent = createComponentFactory({
      component: InstanceFormComponent,
      imports: [
        ReactiveFormsModule,
      ],
      providers: [
        mockAuth(),
        mockApi([
          mockCall('container.pool_choices', { pool1: 'pool1', pool2: 'pool2' }),
          mockCall('lxc.config', {
            bridge: 'lxdbr0',
            v4_network: null,
            v6_network: null,
            preferred_pool: 'pool1',
          }),
          mockCall('container.create'),
          mockCall('container.update', { ...existingInstance, name: 'updated-container', vcpus: 4 } as ContainerInstance),
          mockCall('container.get_instance', existingInstance),
          mockCall('lxc.bridge_choices', { lxdbr0: 'lxdbr0' }),
          mockCall('container.query', []),
        ]),
        mockProvider(SlideInRef, {
          getData: jest.fn(() => existingInstance as ContainerInstance | undefined),
          close: jest.fn(),
          requireConfirmationWhen: jest.fn(),
        }),
        mockProvider(VirtualizationInstancesStore, {
          initialize: jest.fn(),
          instanceUpdated: jest.fn(),
        }),
        mockProvider(MatDialog, {
          open: jest.fn(() => ({
            afterClosed: () => of({
              name: 'ubuntu',
              version: '22.04',
            }),
          })),
        }),
        mockProvider(DialogService),
        mockProvider(Router),
        mockProvider(SnackbarService),
      ],
    });

    beforeEach(() => {
      spectator = createEditComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('submits update call with only changed fields when form is submitted', async () => {
      const api = spectator.inject(ApiService);
      const snackbar = spectator.inject(SnackbarService);
      const slideInRef = spectator.inject(SlideInRef);
      const instancesStore = spectator.inject(VirtualizationInstancesStore);

      const nameInput = await loader.getHarness(IxInputHarness.with({ label: 'Name' }));
      await nameInput.setValue('updated-container');

      const vcpusInput = await loader.getHarness(IxInputHarness.with({ label: 'Virtual CPUs' }));
      await vcpusInput.setValue('4');

      const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await submitButton.click();

      expect(api.call).toHaveBeenCalledWith('container.update', [
        1,
        expect.objectContaining({
          name: 'updated-container',
          vcpus: 4,
        }),
      ]);

      expect(snackbar.success).toHaveBeenCalledWith('Container updated');
      expect(slideInRef.close).toHaveBeenCalledWith({ response: true, error: false });
      expect(instancesStore.instanceUpdated).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'updated-container', vcpus: 4 }),
      );
    });
  });

  describe('preferred pool functionality', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('hides pool selector in basic view when preferred pool is configured', async () => {
      await spectator.fixture.whenStable();
      const poolSelect = spectator.query('ix-select[formControlName="pool"]');
      expect(poolSelect).toBeNull();
    });

    it('shows "Use Preferred Pool" checkbox in Advanced Settings when preferred pool is configured', async () => {
      await spectator.fixture.whenStable();

      // Click Advanced Options button
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();
      spectator.detectChanges();

      await spectator.fixture.whenStable();
      const usePreferredPoolCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Use Preferred Pool' }));
      expect(usePreferredPoolCheckbox).toBeTruthy();
      expect(await usePreferredPoolCheckbox.getValue()).toBe(true);
    });

    it('shows pool selector when "Use Preferred Pool" is unchecked', async () => {
      await spectator.fixture.whenStable();

      // Click Advanced Options button
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();
      spectator.detectChanges();

      await spectator.fixture.whenStable();

      // Uncheck "Use Preferred Pool"
      const usePreferredPoolCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Use Preferred Pool' }));
      await usePreferredPoolCheckbox.setValue(false);
      spectator.detectChanges();

      await spectator.fixture.whenStable();
      const poolSelect = spectator.query('ix-select[formControlName="pool"]');
      expect(poolSelect).toBeTruthy();
    });

    it('sends empty string for pool when no pool is selected (uses preferred pool)', async () => {
      const dialogService = spectator.inject(DialogService);

      const nameInput = await loader.getHarness(IxInputHarness.with({ label: 'Name' }));
      await nameInput.setValue('new-container');

      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['form'].patchValue({
        image: 'ubuntu:22.04',
      });
      spectator.detectChanges();

      const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create' }));
      await submitButton.click();

      expect(dialogService.jobDialog).toHaveBeenCalled();
      const jobDialogCall = (dialogService.jobDialog as jest.Mock).mock.calls[0];
      const jobObservable = jobDialogCall[0];

      // Subscribe to get the actual job parameters
      jobObservable.subscribe((job: { params: unknown[] }) => {
        const payload = job.params[0];
        expect(payload).toMatchObject({
          pool: '',
          name: 'new-container',
        });
      });
    });
  });

  describe('preferred pool functionality without configured pool', () => {
    const createComponentWithoutPreferredPool = createComponentFactory({
      component: InstanceFormComponent,
      imports: [
        ReactiveFormsModule,
      ],
      providers: [
        mockAuth(),
        mockApi([
          mockCall('container.pool_choices', { pool1: 'pool1', pool2: 'pool2' }),
          mockCall('lxc.config', {
            bridge: 'lxdbr0',
            v4_network: null,
            v6_network: null,
            preferred_pool: null,
          }),
          mockJob('container.create', fakeSuccessfulJob(createdInstance)),
          mockCall('container.update', existingInstance),
          mockCall('container.get_instance', existingInstance),
          mockCall('lxc.bridge_choices', { lxdbr0: 'lxdbr0' }),
          mockCall('container.query', []),
        ]),
        mockProvider(SlideInRef, {
          getData: jest.fn(() => undefined as ContainerInstance | undefined),
          close: jest.fn(),
          requireConfirmationWhen: jest.fn(),
        }),
        mockProvider(VirtualizationInstancesStore, {
          initialize: jest.fn(),
        }),
        mockProvider(MatDialog, {
          open: jest.fn(() => ({
            afterClosed: () => of({
              name: 'ubuntu',
              version: '22.04',
            }),
          })),
        }),
        mockProvider(DialogService, {
          jobDialog: jest.fn(() => ({
            afterClosed: () => of({ result: createdInstance }),
          })),
        }),
        mockProvider(Router, {
          navigate: jest.fn(),
        }),
        mockProvider(SnackbarService, {
          success: jest.fn(),
        }),
      ],
    });

    beforeEach(() => {
      spectator = createComponentWithoutPreferredPool();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows pool selector in basic view when no preferred pool is configured', async () => {
      await spectator.fixture.whenStable();
      const poolSelect = spectator.query('ix-select[formControlName="pool"]');
      expect(poolSelect).toBeTruthy();
    });

    it('does not show pool selector in Advanced Settings when no preferred pool is configured', async () => {
      await spectator.fixture.whenStable();

      // Click Advanced Options button
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();
      spectator.detectChanges();

      await spectator.fixture.whenStable();

      // Should still only show one pool selector (in basic view)
      const poolSelects = spectator.queryAll('ix-select[formControlName="pool"]');
      expect(poolSelects).toHaveLength(1);
    });
  });
});
