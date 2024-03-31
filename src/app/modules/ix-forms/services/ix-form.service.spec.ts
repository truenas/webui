import { NgControl } from '@angular/forms';
import { SpectatorService, createServiceFactory } from '@ngneat/spectator/jest';
import { IxFormService } from 'app/modules/ix-forms/services/ix-form.service';

describe('IxFormService', () => {
  let spectator: SpectatorService<IxFormService>;

  const createService = createServiceFactory({
    service: IxFormService,
  });

  const fakeComponents = [
    { control: { name: 'test_control_1' }, element: { nativeElement: { id: 'test_element_1' } } },
    { control: { name: 'test_control_2' }, element: { nativeElement: { id: 'test_element_2' } } },
  ] as {
    control: NgControl;
    element: { nativeElement: HTMLElement };
  }[];

  beforeEach(() => {
    spectator = createService();
    fakeComponents.forEach((component) => {
      spectator.service.registerControl(component.control, component.element);
    });
  });

  describe('getControlsNames', () => {
    it('returns a list of control names', () => {
      expect(spectator.service.getControlsNames()).toEqual([
        'test_control_1',
        'test_control_2',
      ]);
    });
  });

  describe('getControls', () => {
    it('returns a list of controls', () => {
      expect(spectator.service.getControls()).toEqual([
        { name: 'test_control_1' },
        { name: 'test_control_2' },
      ]);
    });
  });

  describe('getControlByName', () => {
    it('returns control by name', () => {
      expect(spectator.service.getControlByName('test_control_2')).toEqual({
        name: 'test_control_2',
      });
    });
  });

  describe('getElementByControlName', () => {
    it('returns element by control name', () => {
      expect(spectator.service.getElementByControlName('test_control_2')).toEqual({
        id: 'test_element_2',
      });
    });
  });
});
