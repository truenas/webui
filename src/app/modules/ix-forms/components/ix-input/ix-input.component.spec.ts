import { NgControl, ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { IxErrorsComponent } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { IxInputComponent } from 'app/modules/ix-forms/components/ix-input/ix-input.component';

describe('IxInputComponent', () => {
  let spectator: Spectator<IxInputComponent>;
  const createComponent = createComponentFactory({
    component: IxInputComponent,
    imports: [
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponent(IxErrorsComponent),
    ],
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
    it('when called with some value, sets \'value\' and \'formatted\' to that value', () => {
      spectator.component.writeValue('test value');
      expect(spectator.component.value).toEqual('test value');
      expect(spectator.component.formatted).toEqual('test value');
    });
    xit('when called with some value, input takes that value', () => {
      spectator.component.writeValue('test value');
      spectator.detectChanges();
      expect(spectator.query('input')).toHaveValue('test value');
    });
  });

  describe('hasValue()', () => {
    it('return false if \'value\' is empty and \'invalid\' is false', () => {
      spectator.component.invalid = false;
      spectator.component.value = '';
      expect(spectator.component.hasValue()).toBeFalsy();
    });
    it('return true if \'value\' isn\'t empty and \'invalid\' is true', () => {
      spectator.component.invalid = true;
      spectator.component.value = 'test value';
      expect(spectator.component.hasValue()).toBeTruthy();
    });
  });

  describe('shouldShowResetInput()', () => {
    it('return true if \'isDisabled\' is false, \'hasValue()\' returned true and \'type\' isn\'t \"password\"', () => {
      spectator.component.isDisabled = false;
      spectator.component.invalid = true;
      spectator.component.value = 'test value';
      spectator.component.type = 'test type';
      expect(spectator.component.shouldShowResetInput()).toBeTruthy();
    });
    it('return false if \'isDisabled\' is true, \'hasValue()\' returned true and \'type\' isn\'t \"password\"', () => {
      spectator.component.isDisabled = true;
      spectator.component.invalid = true;
      spectator.component.value = 'test value';
      spectator.component.type = 'test type';
      expect(spectator.component.shouldShowResetInput()).toBeFalsy();
    });
    it('return false if \'isDisabled\' is false, \'hasValue()\' returned true and \'type\' is \"password\"', () => {
      spectator.component.isDisabled = false;
      spectator.component.invalid = true;
      spectator.component.value = 'test value';
      spectator.component.type = 'password';
      expect(spectator.component.shouldShowResetInput()).toBeFalsy();
    });
  });

  describe('resetInput()', () => {
    it('when called, sets \'value\' and \'formatted\' to empty string', () => {
      spectator.component.resetInput(spectator.query('input'));
      expect(spectator.component.value).toEqual('');
      expect(spectator.component.formatted).toEqual('');
    });
    it('when called, sets \'invalid\' to false', () => {
      spectator.component.resetInput(spectator.query('input'));
      expect(spectator.component.invalid).toBeFalsy();
    });
    it('when called, input takes empty value', () => {
      spectator.component.resetInput(spectator.query('input'));
      spectator.detectChanges();
      expect(spectator.query('input')).toHaveValue('');
    });
    it('when called, input with \'number\' type sets to \'null\'', () => {
      jest.spyOn(spectator.component, 'onChange').mockImplementation();
      spectator.component.type = 'number';
      spectator.component.resetInput(spectator.query('input'));
      spectator.detectChanges();
      expect(spectator.component.onChange).toHaveBeenCalledWith(null);
    });
  });

  describe('getType()', () => {
    it('return \"search\" if \'type\' is \"password\"', () => {
      spectator.component.type = 'password';
      expect(spectator.component.getType()).toEqual('search');
    });
    it('return \'type\' value if type isn\'t \"password\"', () => {
      spectator.component.type = 'test value';
      expect(spectator.component.getType()).toEqual('test value');
    });
  });

  describe('isPasswordField()', () => {
    it('return true if \'type\' is \"password\" and \'showPassword\' is false', () => {
      spectator.component.showPassword = false;
      spectator.component.type = 'password';
      expect(spectator.component.isPasswordField()).toBeTruthy();
    });
  });

  describe('onPasswordToggled()', () => {
    it('when called and \'showPassword\' is false, sets \'showPassword\' to true', () => {
      spectator.component.showPassword = false;
      spectator.component.onPasswordToggled();
      expect(spectator.component.showPassword).toBeTruthy();
    });
    it('when called and \'showPassword\' is true, sets \'showPassword\' to false', () => {
      spectator.component.showPassword = true;
      spectator.component.onPasswordToggled();
      expect(spectator.component.showPassword).toBeFalsy();
    });
  });
});
