import { NgControl } from '@angular/forms';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxSlideToggleComponent } from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';

describe('IxSlideToggleComponent', () => {
  let spectator: Spectator<IxSlideToggleComponent>;
  const createComponent = createComponentFactory({
    component: IxSlideToggleComponent,
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
    it('when called with false, button is not disabled', () => {
      spectator.component.setDisabledState(false);
      spectator.detectChanges();
      expect(spectator.query('button')).not.toBeDisabled();
    });
    it('when called with true, button is disabled', () => {
      spectator.component.setDisabledState(true);
      spectator.detectChanges();
      expect(spectator.query('button')).toBeDisabled();
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

  describe('onSlideToggleChanged()', () => {
    it('when called with true, sets \'value\' to be true', () => {
      const event = { checked: true } as MatSlideToggleChange;
      spectator.component.onSlideToggleChanged(event);
      expect(spectator.component.value).toBeTruthy();
    });
    it('when called with false, sets \'value\' to be false', () => {
      const event = { checked: false } as MatSlideToggleChange;
      spectator.component.onSlideToggleChanged(event);
      expect(spectator.component.value).toBeFalsy();
    });
  });
});
