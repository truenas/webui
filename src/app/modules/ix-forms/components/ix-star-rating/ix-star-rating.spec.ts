import { NgControl } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { IxErrorsComponent } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/ix-forms/components/ix-label/ix-label.component';
import { IxStarRatingComponent } from 'app/modules/ix-forms/components/ix-star-rating/ix-star-rating.component';

describe('IxStarRatingComponent', () => {
  let spectator: Spectator<IxStarRatingComponent>;
  const createComponent = createComponentFactory({
    component: IxStarRatingComponent,
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
    it('when called with 1, sets \'value\' to that value', () => {
      spectator.component.writeValue(1);
      expect(spectator.component.value).toBe(1);
    });
    it('when called with 0, sets \'value\' to that value', () => {
      spectator.component.writeValue(0);
      expect(spectator.component.value).toBe(0);
    });
    it('when called with 6, sets \'value\' to maxRating value', () => {
      spectator.component.writeValue(6);
      expect(spectator.component.value).toBe(spectator.component.maxRating);
    });
    it('when called with 6, sets \'value\' to that value when maxRating is 10', () => {
      spectator.component.maxRating = 10;
      spectator.component.writeValue(6);
      expect(spectator.component.value).toBe(6);
    });
    it('when called with 11, sets \'value\' to that value when maxRating is 10', () => {
      spectator.component.maxRating = 10;
      spectator.component.writeValue(11);
      expect(spectator.component.value).toBe(spectator.component.maxRating);
    });
  });

  describe('onValueChanged()', () => {
    it('when called with 4, sets \'value\' to be 4', () => {
      spectator.component.onValueChanged(4);
      expect(spectator.component.value).toBe(4);
    });
    it('when called with 0, sets \'value\' to be 0', () => {
      spectator.component.onValueChanged(0);
      expect(spectator.component.value).toBe(0);
    });
    it('when called with 6, sets \'value\' to be maxRating value', () => {
      spectator.component.onValueChanged(6);
      expect(spectator.component.value).toBe(spectator.component.maxRating);
    });
  });
});
