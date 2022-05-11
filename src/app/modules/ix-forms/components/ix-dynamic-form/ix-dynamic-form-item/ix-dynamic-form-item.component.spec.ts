import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxDynamicFormItemComponent } from 'app/modules/ix-forms/components/ix-dynamic-form/ix-dynamic-form-item/ix-dynamic-form-item.component';

describe('IxDynamicFormItemComponent', () => {
  let spectator: Spectator<IxDynamicFormItemComponent>;
  const createComponent = createComponentFactory({
    component: IxDynamicFormItemComponent,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  describe('Control Emit', () => {
    it('addControlNext()', () => {
      jest.spyOn(spectator.component.addListItem, 'emit').mockImplementation();
      spectator.component.addControlNext(undefined);
      expect(spectator.component.addListItem.emit).toHaveBeenCalledTimes(1);
    });
    it('removeControlNext()', () => {
      jest.spyOn(spectator.component.deleteListItem, 'emit').mockImplementation();
      spectator.component.removeControlNext(undefined);
      expect(spectator.component.deleteListItem.emit).toHaveBeenCalledTimes(1);
    });
  });
});
