import { ElementRef } from '@angular/core';
import { SpectatorService, createServiceFactory } from '@ngneat/spectator/jest';
import { ixControlLabelTag } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';

describe('IxFormService', () => {
  let spectator: SpectatorService<IxFormService>;

  const createService = createServiceFactory({
    service: IxFormService,
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('handles control register/unregister', () => {
    it('registers control', () => {
      const elRef = new ElementRef<HTMLElement>(document.createElement('input'));
      elRef.nativeElement.setAttribute('id', 'control1');
      elRef.nativeElement.setAttribute(ixControlLabelTag, 'Control1');
      spectator.service.registerControl(
        'control1',
        elRef,
      );

      expect(spectator.service.getControlNames()).toEqual(['control1']);
      expect(spectator.service.getElementByControlName('control1')).toEqual(elRef.nativeElement);
    });

    it('unregisters control', () => {
      const elRef = new ElementRef<HTMLElement>(document.createElement('input'));
      elRef.nativeElement.setAttribute('id', 'control1');
      elRef.nativeElement.setAttribute(ixControlLabelTag, 'Control1');
      spectator.service.registerControl(
        'control1',
        elRef,
      );

      expect(spectator.service.getControlNames()).toEqual(['control1']);
      spectator.service.unregisterControl('control1');
      expect(spectator.service.getControlNames()).toEqual([]);
    });
  });
});
