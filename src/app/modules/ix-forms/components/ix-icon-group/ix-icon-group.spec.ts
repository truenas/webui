import { NgControl } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { IxErrorsComponent } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { IxIconGroupComponent } from 'app/modules/ix-forms/components/ix-icon-group/ix-icon-group.component';
import { IxLabelComponent } from 'app/modules/ix-forms/components/ix-label/ix-label.component';

describe('IxIconGroupComponent', () => {
  let spectator: Spectator<IxIconGroupComponent>;
  const createComponent = createComponentFactory({
    component: IxIconGroupComponent,
    declarations: [
      MockComponent(IxLabelComponent),
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
    it('when called with false, button is not disabled', () => {
      spectator.component.setDisabledState(false);
      spectator.detectChanges();
      expect(spectator.query('button')).not.toBeDisabled();
    });
    it('when called with true, buton is disabled', () => {
      spectator.component.setDisabledState(true);
      spectator.detectChanges();
      expect(spectator.query('button')).toBeDisabled();
    });
  });

  describe('writeValue()', () => {
    // it('when called with 1, sets \'value\' to that value', () => {
    //   spectator.component.writeValue(1);
    //   expect(spectator.component.value).toBe(1);
    // });
  });

  describe('onValueChanged()', () => {
    // it('when called with 4, sets \'value\' to be 4', () => {
    //   spectator.component.onValueChanged(4);
    //   expect(spectator.component.value).toBe(4);
    // });
  });
});
