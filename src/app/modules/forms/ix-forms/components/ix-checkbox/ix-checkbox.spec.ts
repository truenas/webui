import { NgControl } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';

describe('IxCheckboxComponent', () => {
  let spectator: Spectator<IxCheckboxComponent>;
  const createComponent = createComponentFactory({
    component: IxCheckboxComponent,
    declarations: [MockComponent(IxErrorsComponent)],
    providers: [NgControl],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  describe('setDisabledState()', () => {
    it('when called with false, sets \'isDisabled\' to false', () => {
      spectator.component.setDisabledState(false);
      expect(spectator.component.isDisabled).toBeFalsy();
    });
    it('when called with true, sets \'isDisabled\' to true', () => {
      spectator.component.setDisabledState(true);
      expect(spectator.component.isDisabled).toBeTruthy();
    });
    it('when called with false, input is not disabled', () => {
      spectator.component.setDisabledState(false);
      spectator.detectChanges();
      expect(spectator.query('input')).not.toBeDisabled();
    });
    it('when called with true, input is disabled', () => {
      spectator.component.setDisabledState(true);
      spectator.detectChanges();
      expect(spectator.query('input')).toBeDisabled();
    });
  });

  describe('writeValue()', () => {
    it('when called with true, sets \'value\' to that value', () => {
      spectator.component.writeValue(true);
      expect(spectator.component.value).toBeTruthy();
    });
    it('when called with false, sets \'value\' to that value', () => {
      spectator.component.writeValue(false);
      expect(spectator.component.value).toBeFalsy();
    });
  });

  describe('onCheckboxChanged()', () => {
    it('when called with true, sets \'value\' to be true', () => {
      const event = { checked: true } as MatCheckboxChange;
      spectator.component.onCheckboxChanged(event);
      expect(spectator.component.value).toBeTruthy();
    });
    it('when called with false, sets \'value\' to be false', () => {
      const event = { checked: false } as MatCheckboxChange;
      spectator.component.onCheckboxChanged(event);
      expect(spectator.component.value).toBeFalsy();
    });
  });
});
