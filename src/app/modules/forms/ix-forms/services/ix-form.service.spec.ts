import { ElementRef } from '@angular/core';
import { FormControl, NgControl } from '@angular/forms';
import { SpectatorService, createServiceFactory } from '@ngneat/spectator/jest';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { IxFormSectionComponent } from 'app/modules/forms/ix-forms/components/ix-form-section/ix-form-section.component';
import { ixControlLabelTag } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';

class MockNgControl extends NgControl {
  override control = new FormControl('mock-value');

  override viewToModelUpdate(newValue: string): void {
    this.control.setValue(newValue);
  }
}

describe('IxFormService', () => {
  let spectator: SpectatorService<IxFormService>;
  let testScheduler: TestScheduler;

  const createService = createServiceFactory({
    service: IxFormService,
  });

  beforeEach(() => {
    spectator = createService();
    testScheduler = getTestScheduler();
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
      testScheduler.run(({ expectObservable }) => {
        expectObservable(spectator.service.controlNamesWithLabels$).toBe('a', {
          a: [{ label: 'Control1', name: 'control1' }],
        });
      });
      expect(spectator.service.getElementByControlName('control1')).toEqual(elRef.nativeElement);
      expect(spectator.service.getElementByLabel('Control1')).toEqual(elRef.nativeElement);
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

  it('registers section control', () => {
    const ngControl = new MockNgControl();
    const formSection = {
      label(): string { return 'Form Section'; },
    } as IxFormSectionComponent;
    spectator.service.registerSectionControl(
      ngControl,
      formSection,
    );

    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.controlSections$).toBe('a', {
        a: [
          { section: formSection, controls: [ngControl] },
        ],
      });
    });

    spectator.service.unregisterSectionControl(formSection, ngControl);
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.controlSections$).toBe('a', {
        a: [],
      });
    });
  });
});
