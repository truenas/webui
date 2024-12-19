import { NgControl } from '@angular/forms';
import { SpectatorService, createServiceFactory } from '@ngneat/spectator/jest';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';

// TODO: https://ixsystems.atlassian.net/browse/NAS-133118
describe.skip('IxFormService', () => {
  let spectator: SpectatorService<IxFormService>;

  const createService = createServiceFactory({
    service: IxFormService,
  });

  const fakeComponents = [
    {
      control: {
        name: 'test_control_1',
      },
      element: {
        nativeElement: {
          id: 'test_element_1',
        },
        getAttribute: () => 'Test Element 1',
      },
    },
    {
      control: {
        name: 'test_control_2',
      },
      element: {
        nativeElement: {
          id: 'test_element_2',
        },
        getAttribute: () => 'Test Element 2',
      },
    },
  ] as {
    control: NgControl;
    element: { nativeElement: HTMLElement; getAttribute: () => string };
  }[];

  beforeEach(() => {
    spectator = createService();
    fakeComponents.forEach((component) => {
      spectator.service.registerControl(component.control.name.toString(), component.element);
    });
  });

  describe('getControlsNames', () => {
    it('returns a list of control names', () => {
      expect(spectator.service.getControlNames()).toEqual([
        'test_control_1',
        'test_control_2',
      ]);
    });
  });

  describe('getControls', () => {
    it('returns a list of controls', () => {
      expect(spectator.service.getControlNames()).toEqual([
        'test_control_1',
        'test_control_2',
      ]);
    });
  });

  describe('getControlByName', () => {
    it('returns control by name', () => {
      expect(spectator.service.getControlNames()).toEqual(['test_control_2']);
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
