import { FormBuilder } from '@ngneat/reactive-forms';
import { configurePortControlsForMode, PortModeControls } from './port-mode-control.helper';

describe('configurePortControlsForMode', () => {
  let fb: FormBuilder;
  let controls: PortModeControls;

  beforeEach(() => {
    fb = new FormBuilder();
    controls = {
      port: fb.control<string | null>(null),
      host_id: fb.control<number | null>(null),
    };
  });

  describe('existing mode', () => {
    it('enables port control and disables host_id control', () => {
      configurePortControlsForMode('existing', controls);

      expect(controls.port.enabled).toBe(true);
      expect(controls.host_id.disabled).toBe(true);
    });

    it('sets required validator on port control', () => {
      configurePortControlsForMode('existing', controls);

      controls.port.setValue(null);
      expect(controls.port.hasError('required')).toBe(true);

      controls.port.setValue('fc0');
      expect(controls.port.hasError('required')).toBe(false);
    });

    it('clears validators from host_id control', () => {
      // First set validators on host_id
      configurePortControlsForMode('new', controls);
      controls.host_id.setValue(null);
      expect(controls.host_id.hasError('required')).toBe(true);

      // Switch to existing mode
      configurePortControlsForMode('existing', controls);
      controls.host_id.setValue(null);
      expect(controls.host_id.hasError('required')).toBe(false);
    });

    it('clears host_id value', () => {
      controls.host_id.setValue(123);

      configurePortControlsForMode('existing', controls);

      expect(controls.host_id.value).toBeNull();
    });

    it('calls updateValueAndValidity on both controls', () => {
      const portSpy = jest.spyOn(controls.port, 'updateValueAndValidity');
      const hostSpy = jest.spyOn(controls.host_id, 'updateValueAndValidity');

      configurePortControlsForMode('existing', controls);

      expect(portSpy).toHaveBeenCalled();
      expect(hostSpy).toHaveBeenCalled();
    });
  });

  describe('new mode', () => {
    it('enables host_id control and disables port control', () => {
      configurePortControlsForMode('new', controls);

      expect(controls.host_id.enabled).toBe(true);
      expect(controls.port.disabled).toBe(true);
    });

    it('sets required validator on host_id control', () => {
      configurePortControlsForMode('new', controls);

      controls.host_id.setValue(null);
      expect(controls.host_id.hasError('required')).toBe(true);

      controls.host_id.setValue(1);
      expect(controls.host_id.hasError('required')).toBe(false);
    });

    it('clears validators from port control', () => {
      // First set validators on port
      configurePortControlsForMode('existing', controls);
      controls.port.setValue(null);
      expect(controls.port.hasError('required')).toBe(true);

      // Switch to new mode
      configurePortControlsForMode('new', controls);
      controls.port.setValue(null);
      expect(controls.port.hasError('required')).toBe(false);
    });

    it('clears port value', () => {
      controls.port.setValue('fc0');

      configurePortControlsForMode('new', controls);

      expect(controls.port.value).toBeNull();
    });

    it('calls updateValueAndValidity on both controls', () => {
      const portSpy = jest.spyOn(controls.port, 'updateValueAndValidity');
      const hostSpy = jest.spyOn(controls.host_id, 'updateValueAndValidity');

      configurePortControlsForMode('new', controls);

      expect(portSpy).toHaveBeenCalled();
      expect(hostSpy).toHaveBeenCalled();
    });
  });

  describe('mode switching', () => {
    it('correctly transitions from existing to new mode', () => {
      // Start in existing mode
      configurePortControlsForMode('existing', controls);
      controls.port.setValue('fc0');
      expect(controls.port.value).toBe('fc0');
      expect(controls.port.enabled).toBe(true);
      expect(controls.host_id.disabled).toBe(true);

      // Switch to new mode
      configurePortControlsForMode('new', controls);
      expect(controls.port.value).toBeNull(); // Cleared
      expect(controls.port.disabled).toBe(true);
      expect(controls.host_id.enabled).toBe(true);
    });

    it('correctly transitions from new to existing mode', () => {
      // Start in new mode
      configurePortControlsForMode('new', controls);
      controls.host_id.setValue(123);
      expect(controls.host_id.value).toBe(123);
      expect(controls.host_id.enabled).toBe(true);
      expect(controls.port.disabled).toBe(true);

      // Switch to existing mode
      configurePortControlsForMode('existing', controls);
      expect(controls.host_id.value).toBeNull(); // Cleared
      expect(controls.host_id.disabled).toBe(true);
      expect(controls.port.enabled).toBe(true);
    });

    it('handles multiple mode switches without validator accumulation', () => {
      // Switch modes multiple times
      configurePortControlsForMode('existing', controls);
      configurePortControlsForMode('new', controls);
      configurePortControlsForMode('existing', controls);
      configurePortControlsForMode('new', controls);
      configurePortControlsForMode('existing', controls);

      // Verify validation still works correctly (no accumulated validators)
      controls.port.setValue(null);
      expect(controls.port.hasError('required')).toBe(true);

      controls.port.setValue('fc0');
      expect(controls.port.hasError('required')).toBe(false);
      expect(controls.port.valid).toBe(true);
    });
  });

  describe('form integration', () => {
    it('integrates correctly with form group', () => {
      const form = fb.group(controls);

      configurePortControlsForMode('existing', controls);
      expect(form.invalid).toBe(true); // port is required but null

      controls.port.setValue('fc0');
      expect(form.valid).toBe(true);

      configurePortControlsForMode('new', controls);
      expect(form.invalid).toBe(true); // host_id is required but null

      controls.host_id.setValue(1);
      expect(form.valid).toBe(true);
    });

    it('returns correct getRawValue after mode switch', () => {
      const form = fb.group(controls);

      configurePortControlsForMode('existing', controls);
      controls.port.setValue('fc0');

      let rawValue = form.getRawValue();
      expect(rawValue).toEqual({ port: 'fc0', host_id: null });

      configurePortControlsForMode('new', controls);
      controls.host_id.setValue(123);

      rawValue = form.getRawValue();
      expect(rawValue).toEqual({ port: null, host_id: 123 });
    });
  });
});
