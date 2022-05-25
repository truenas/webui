import { FlexLayoutModule } from '@angular/flex-layout';
import {
  FormGroup, FormsModule, ReactiveFormsModule,
} from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { DynamicFormSchema } from 'app/interfaces/dynamic-form-schema.interface';
import { IxDynamicFormItemComponent } from 'app/modules/ix-forms/components/ix-dynamic-form/ix-dynamic-form-item/ix-dynamic-form-item.component';
import { IxDynamicFormComponent } from 'app/modules/ix-forms/components/ix-dynamic-form/ix-dynamic-form.component';
import { IxFieldsetComponent } from 'app/modules/ix-forms/components/ix-fieldset/ix-fieldset.component';

const dynamicForm = new FormGroup({});
const dynamicSection = [
  { name: 'section_1', description: '', schema: [{}, {}] },
  { name: 'section_2', description: '', schema: [{}] },
  { name: 'section_3', description: '', schema: [{}, {}, {}] },
  { name: 'section_4', description: '', schema: [{}] },
] as DynamicFormSchema[];

describe('IxDynamicFormComponent', () => {
  let spectator: Spectator<IxDynamicFormComponent>;
  const createComponent = createComponentFactory({
    component: IxDynamicFormComponent,
    imports: [
      FormsModule,
      ReactiveFormsModule,
      FlexLayoutModule,
    ],
    declarations: [
      MockComponent(IxDynamicFormItemComponent),
      MockComponent(IxFieldsetComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  describe('UI tests', () => {
    it('section', () => {
      spectator.component.dynamicForm = dynamicForm;
      spectator.component.dynamicSection = dynamicSection;
      spectator.detectComponentChanges();

      expect(spectator.queryAll('ix-dynamic-form-item').length).toEqual(7);
    });
  });

  describe('Component methods', () => {
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
