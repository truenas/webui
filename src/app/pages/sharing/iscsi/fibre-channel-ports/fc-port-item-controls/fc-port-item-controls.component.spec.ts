import { FormBuilder, FormControl, FormGroup } from '@ngneat/reactive-forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { lastValueFrom } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { FibreChannelHost, FibreChannelPortChoices } from 'app/interfaces/fibre-channel.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { FcPortItemControlsComponent } from './fc-port-item-controls.component';

describe('FcPortItemControlsComponent', () => {
  let spectator: Spectator<FcPortItemControlsComponent>;
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
  });

  describe('initialization', () => {
    it('creates component successfully', () => {
      expect(spectator.component).toBeTruthy();
    });

    it('defaults to "existing" mode', () => {
      expect(spectator.component.modeControl.value).toBe('existing');
    });

    it('loads existing port options', async () => {
      const options = await lastValueFrom(spectator.component.existingPortOptions$);
      expect(options).toHaveLength(2);
      expect(options[0].label).toBe('fc0');
      expect(options[1].label).toBe('fc1');
    });

    it('loads creating port options', async () => {
      const options = await lastValueFrom(spectator.component.creatingPortOptions$);
      expect(options).toHaveLength(2);
      expect(options[0].label).toBe('fc/2');
      expect(options[1].label).toBe('fc1/1');
    });
  });

  describe('mode switching', () => {
    it('enables port control and disables host_id when mode is "existing"', () => {
      spectator.component.modeControl.setValue('existing');
      spectator.detectChanges();

      expect(mockForm.controls.port.disabled).toBe(false);
      expect(mockForm.controls.host_id.disabled).toBe(true);
      expect(mockForm.controls.host_id.value).toBeNull();
    });

    it('enables host_id control and disables port when mode is "new"', () => {
      spectator.component.modeControl.setValue('new');
      spectator.detectChanges();

      expect(mockForm.controls.port.disabled).toBe(true);
      expect(mockForm.controls.host_id.disabled).toBe(false);
      expect(mockForm.controls.port.value).toBeNull();
    });

    it('adds required validator to port when mode is "existing"', () => {
      spectator.component.modeControl.setValue('existing');
      spectator.detectChanges();

      mockForm.controls.port.setValue(null);
      expect(mockForm.controls.port.hasError('required')).toBe(true);
    });

    it('adds required validator to host_id when mode is "new"', () => {
      spectator.component.modeControl.setValue('new');
      spectator.detectChanges();

      mockForm.controls.host_id.setValue(null);
      expect(mockForm.controls.host_id.hasError('required')).toBe(true);
    });

    it('removes required validator from host_id when switching to "existing"', () => {
      spectator.component.modeControl.setValue('new');
      spectator.detectChanges();
      mockForm.controls.host_id.setValue(null);
      expect(mockForm.controls.host_id.hasError('required')).toBe(true);

      spectator.component.modeControl.setValue('existing');
      spectator.detectChanges();
      expect(mockForm.controls.host_id.hasError('required')).toBe(false);
    });

    it('removes required validator from port when switching to "new"', () => {
      spectator.component.modeControl.setValue('existing');
      spectator.detectChanges();
      mockForm.controls.port.setValue(null);
      expect(mockForm.controls.port.hasError('required')).toBe(true);

      spectator.component.modeControl.setValue('new');
      spectator.detectChanges();
      expect(mockForm.controls.port.hasError('required')).toBe(false);
    });
  });

  describe('edit mode', () => {
    beforeEach(() => {
      spectator.setInput('isEdit', true);
      spectator.setInput('currentPort', 'fc0');
      spectator.detectChanges();
    });

    it('prefills port control with currentPort value', () => {
      expect(mockForm.controls.port.value).toBe('fc0');
    });

    it('sets host_id to null in edit mode', () => {
      expect(mockForm.controls.host_id.value).toBeNull();
    });

    it('defaults to "existing" mode in edit mode', () => {
      expect(spectator.component.modeControl.value).toBe('existing');
    });
  });

  describe('form integration', () => {
    it('respects parent form port control changes', () => {
      mockForm.controls.port.setValue('fc1');
      expect(spectator.component.form().controls.port.value).toBe('fc1');
    });

    it('respects parent form host_id control changes', () => {
      mockForm.controls.host_id.setValue(2);
      expect(spectator.component.form().controls.host_id.value).toBe(2);
    });

    it('propagates port selection to parent form', () => {
      spectator.component.modeControl.setValue('existing');
      mockForm.controls.port.setValue('fc0');
      spectator.detectChanges();

      expect(spectator.component.form().controls.port.value).toBe('fc0');
    });

    it('propagates host_id selection to parent form', () => {
      spectator.component.modeControl.setValue('new');
      mockForm.controls.host_id.setValue(1);
      spectator.detectChanges();

      expect(spectator.component.form().controls.host_id.value).toBe(1);
    });
  });

  describe('validation', () => {
    it('form is invalid when mode is "existing" and no port selected', () => {
      spectator.component.modeControl.setValue('existing');
      mockForm.controls.port.setValue(null);
      spectator.detectChanges();

      expect(mockForm.invalid).toBe(true);
    });

    it('form is valid when mode is "existing" and port selected', () => {
      spectator.component.modeControl.setValue('existing');
      mockForm.controls.port.setValue('fc0');
      spectator.detectChanges();

      expect(mockForm.valid).toBe(true);
    });

    it('form is invalid when mode is "new" and no host_id selected', () => {
      spectator.component.modeControl.setValue('new');
      mockForm.controls.host_id.setValue(null);
      spectator.detectChanges();

      expect(mockForm.invalid).toBe(true);
    });

    it('form is valid when mode is "new" and host_id selected', () => {
      spectator.component.modeControl.setValue('new');
      mockForm.controls.host_id.setValue(1);
      spectator.detectChanges();

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

    it('formats existing port options correctly', async () => {
      const options = await lastValueFrom(spectator.component.existingPortOptions$);
      expect(options[0]).toEqual({ label: 'fc0', value: 'fc0' });
      expect(options[1]).toEqual({ label: 'fc1', value: 'fc1' });
    });

    it('formats creating port options correctly', async () => {
      const options = await lastValueFrom(spectator.component.creatingPortOptions$);
      expect(options[0]).toEqual({ label: 'fc/2', value: 1 });
      expect(options[1]).toEqual({ label: 'fc1/1', value: 2 });
    });
  });
});
