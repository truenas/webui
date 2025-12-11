import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormBuilder, FormControl, FormGroup } from '@ngneat/reactive-forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { FibreChannelHost, FibreChannelPortChoices } from 'app/interfaces/fibre-channel.interface';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { FcPortItemControlsComponent } from './fc-port-item-controls.component';

describe('FcPortItemControlsComponent', () => {
  let spectator: Spectator<FcPortItemControlsComponent>;
  let loader: HarnessLoader;
  let mockForm: FormGroup<{
    port: FormControl<string | null>;
    host_id: FormControl<number | null>;
  }>;

  const mockPortChoices: FibreChannelPortChoices = {
    fc0: { wwpn: '10:00:00:00:c9:20:00:00', wwpn_b: '10:00:00:00:c9:20:00:01' },
    fc1: { wwpn: '10:00:00:00:c9:30:00:00', wwpn_b: '10:00:00:00:c9:30:00:01' },
  };

  const mockHosts: FibreChannelHost[] = [
    {
      id: 1, alias: 'fc', npiv: 1, wwpn: '10:00:00:00:c9:20:00:00', wwpn_b: '10:00:00:00:c9:20:00:01',
    },
    {
      id: 2, alias: 'fc1', npiv: 0, wwpn: '10:00:00:00:c9:30:00:00', wwpn_b: '10:00:00:00:c9:30:00:01',
    },
  ];

  const createComponent = createComponentFactory({
    component: FcPortItemControlsComponent,
    providers: [
      FormBuilder,
      mockApi([
        mockCall('fcport.port_choices', mockPortChoices),
        mockCall('fc.fc_host.query', mockHosts),
      ]),
    ],
  });

  beforeEach(() => {
    const fb = new FormBuilder();
    mockForm = fb.group({
      port: fb.control<string | null>(null),
      host_id: fb.control<number | null>(null),
    });

    spectator = createComponent({
      props: {
        form: mockForm,
        isEdit: false,
        currentPort: null,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('initialization', () => {
    it('creates component successfully', () => {
      expect(spectator.component).toBeTruthy();
    });

    it('defaults to "existing" mode and shows existing port selector', async () => {
      const modeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Port Mode' }));
      expect(await modeSelect.getValue()).toBe('Use existing port');

      // Verify existing port selector is visible
      const portSelect = await loader.getHarnessOrNull(IxSelectHarness.with({ label: 'Existing Port' }));
      expect(portSelect).toBeTruthy();

      // Verify new port selector is NOT visible
      const hostSelect = await loader.getHarnessOrNull(IxSelectHarness.with({ label: 'Choose Host for New Virtual Port' }));
      expect(hostSelect).toBeNull();
    });

    it('loads existing port options correctly', async () => {
      const portSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Existing Port' }));
      const options = await portSelect.getOptionLabels();

      expect(options).toContain('fc0');
      expect(options).toContain('fc1');
    });
  });

  describe('mode switching', () => {
    it('switches to "new" mode and shows host selector when user selects create new virtual port', async () => {
      const modeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Port Mode' }));
      await modeSelect.setValue('Create new virtual port');

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify new port selector is now visible
      const hostSelect = await loader.getHarnessOrNull(IxSelectHarness.with({ label: 'Choose Host for New Virtual Port' }));
      expect(hostSelect).toBeTruthy();

      // Verify existing port selector is hidden
      const portSelect = await loader.getHarnessOrNull(IxSelectHarness.with({ label: 'Existing Port' }));
      expect(portSelect).toBeNull();
    });

    it('loads host options correctly in new mode', async () => {
      const modeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Port Mode' }));
      await modeSelect.setValue('Create new virtual port');

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const hostSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Choose Host for New Virtual Port' }));
      const options = await hostSelect.getOptionLabels();

      expect(options).toContain('fc/2');
      expect(options).toContain('fc1/1');
    });

    it('switches back to "existing" mode and shows port selector', async () => {
      const modeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Port Mode' }));

      // Switch to new mode first
      await modeSelect.setValue('Create new virtual port');
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Switch back to existing
      await modeSelect.setValue('Use existing port');
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify existing port selector is visible again
      const portSelect = await loader.getHarnessOrNull(IxSelectHarness.with({ label: 'Existing Port' }));
      expect(portSelect).toBeTruthy();

      // Verify new port selector is hidden
      const hostSelect = await loader.getHarnessOrNull(IxSelectHarness.with({ label: 'Choose Host for New Virtual Port' }));
      expect(hostSelect).toBeNull();
    });

    it('clears port value when switching to "new" mode', async () => {
      // First select a port in existing mode
      const portSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Existing Port' }));
      await portSelect.setValue('fc0');
      expect(mockForm.controls.port.value).toBe('fc0');

      // Switch to new mode
      const modeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Port Mode' }));
      await modeSelect.setValue('Create new virtual port');
      spectator.detectChanges();

      // Port value should be cleared
      expect(mockForm.controls.port.value).toBeNull();
    });

    it('clears host_id value when switching to "existing" mode', async () => {
      // Switch to new mode and select a host
      const modeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Port Mode' }));
      await modeSelect.setValue('Create new virtual port');
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const hostSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Choose Host for New Virtual Port' }));
      await hostSelect.setValue('fc/2');
      expect(mockForm.controls.host_id.value).toBe(1);

      // Switch to existing mode
      await modeSelect.setValue('Use existing port');
      spectator.detectChanges();

      // Host_id value should be cleared
      expect(mockForm.controls.host_id.value).toBeNull();
    });
  });

  describe('edit mode', () => {
    beforeEach(async () => {
      const fb = new FormBuilder();
      mockForm = fb.group({
        port: fb.control<string | null>(null),
        host_id: fb.control<number | null>(null),
      });

      spectator = createComponent({
        props: {
          form: mockForm,
          isEdit: true,
          currentPort: 'fc0',
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      spectator.detectChanges();
      await spectator.fixture.whenStable();
    });

    it('prefills port control with currentPort value', async () => {
      expect(mockForm.controls.port.value).toBe('fc0');

      const portSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Existing Port' }));
      expect(await portSelect.getValue()).toBe('fc0');
    });

    it('defaults to "existing" mode in edit mode', async () => {
      const modeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Port Mode' }));
      expect(await modeSelect.getValue()).toBe('Use existing port');
    });

    it('shows existing port selector in edit mode', async () => {
      const portSelect = await loader.getHarnessOrNull(IxSelectHarness.with({ label: 'Existing Port' }));
      expect(portSelect).toBeTruthy();
    });
  });

  describe('form integration', () => {
    it('updates parent form when user selects a port in existing mode', async () => {
      const portSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Existing Port' }));
      await portSelect.setValue('fc1');

      expect(mockForm.controls.port.value).toBe('fc1');
    });

    it('updates parent form when user selects a host in new mode', async () => {
      const modeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Port Mode' }));
      await modeSelect.setValue('Create new virtual port');
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const hostSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Choose Host for New Virtual Port' }));
      await hostSelect.setValue('fc/2');

      expect(mockForm.controls.host_id.value).toBe(1);
    });
  });

  describe('validation', () => {
    it('form is invalid when mode is "existing" and no port selected', () => {
      // Port is null by default in existing mode
      expect(mockForm.invalid).toBe(true);
      expect(mockForm.controls.port.hasError('required')).toBe(true);
    });

    it('form is valid when mode is "existing" and port selected', async () => {
      const portSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Existing Port' }));
      await portSelect.setValue('fc0');

      expect(mockForm.valid).toBe(true);
    });

    it('form is invalid when mode is "new" and no host_id selected', async () => {
      const modeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Port Mode' }));
      await modeSelect.setValue('Create new virtual port');
      spectator.detectChanges();

      expect(mockForm.invalid).toBe(true);
      expect(mockForm.controls.host_id.hasError('required')).toBe(true);
    });

    it('form is valid when mode is "new" and host_id selected', async () => {
      const modeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Port Mode' }));
      await modeSelect.setValue('Create new virtual port');
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const hostSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Choose Host for New Virtual Port' }));
      await hostSelect.setValue('fc/2');

      expect(mockForm.valid).toBe(true);
    });
  });

  describe('API data loading', () => {
    it('calls fcport.port_choices with correct parameters', () => {
      const apiService = spectator.inject(ApiService);
      expect(apiService.call).toHaveBeenCalledWith('fcport.port_choices', [false]);
    });

    it('calls fc.fc_host.query', () => {
      const apiService = spectator.inject(ApiService);
      expect(apiService.call).toHaveBeenCalledWith('fc.fc_host.query');
    });
  });

  describe('validator management', () => {
    it('does not accumulate validators on repeated mode switches', async () => {
      const modeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Port Mode' }));

      // Switch modes multiple times
      await modeSelect.setValue('Create new virtual port');
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await modeSelect.setValue('Use existing port');
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await modeSelect.setValue('Create new virtual port');
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await modeSelect.setValue('Use existing port');
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify form validity works correctly after multiple switches
      expect(mockForm.invalid).toBe(true); // port is required but null

      const portSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Existing Port' }));
      await portSelect.setValue('fc0');

      expect(mockForm.valid).toBe(true); // Should be valid with one port selected
    });
  });
});
