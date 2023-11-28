import { NgControl } from '@angular/forms';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { IxErrorsComponent } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { IxButtonGroupComponent } from './ix-button-group.component';

describe('IxButtonGroupComponent', () => {
  let spectator: Spectator<IxButtonGroupComponent>;
  const createComponent = createComponentFactory({
    component: IxButtonGroupComponent,
    imports: [MatButtonToggleModule],
    declarations: [MockComponent(IxErrorsComponent)],
    providers: [NgControl],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should disable button group', () => {
    spectator.component.setDisabledState(true);
    expect(spectator.component.isDisabled).toBe(true);
  });

  it('should emit value change', () => {
    const onChangeSpy = jest.spyOn(spectator.component, 'onChange');
    spectator.component.onValueChanged({ value: 'test' } as MatButtonToggleChange);
    expect(onChangeSpy).toHaveBeenCalledWith('test');
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
  });

  describe('onButtonToggleChanged()', () => {
    it('when called with true, sets \'value\' to be true', () => {
      const event = { value: true } as MatButtonToggleChange;
      spectator.component.onValueChanged(event);
      expect(spectator.component.value).toBeTruthy();
    });
    it('when called with false, sets \'value\' to be false', () => {
      const event = { value: false } as MatButtonToggleChange;
      spectator.component.onValueChanged(event);
      expect(spectator.component.value).toBeFalsy();
    });
  });
});
