import {
  FormGroup, ReactiveFormsModule,
} from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NgxPopperjsContentComponent, NgxPopperjsDirective, NgxPopperjsLooseDirective } from 'ngx-popperjs';
import { DynamicFormSchema } from 'app/interfaces/dynamic-form-schema.interface';
import { IxDynamicFormItemComponent } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/ix-dynamic-form-item/ix-dynamic-form-item.component';
import { IxDynamicFormComponent } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/ix-dynamic-form.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';

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
      ReactiveFormsModule,
      NgxPopperjsContentComponent,
      NgxPopperjsLooseDirective,
      NgxPopperjsDirective,
      MockComponent(IxDynamicFormItemComponent),
      MockComponent(IxFieldsetComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { dynamicForm, dynamicSection },
    });
  });

  describe('Component rendering', () => {
    it('renders a correct number of sections', () => {
      expect(spectator.queryAll('ix-fieldset')).toHaveLength(dynamicSection.length);
    });

    it('renders a correct number of dynamic form', () => {
      let dynamicFormsAmount = 0;
      dynamicSection.forEach((section) => dynamicFormsAmount += section.schema.length);

      expect(spectator.queryAll('ix-dynamic-form-item')).toHaveLength(dynamicFormsAmount);
    });
  });

  describe('Component methods', () => {
    it('forwarding "addListItem" event', () => {
      jest.spyOn(spectator.component.addListItem, 'emit').mockImplementation();
      spectator.component.addControlNext(undefined);
      expect(spectator.component.addListItem.emit).toHaveBeenCalledTimes(1);
    });

    it('forwarding "deleteListItem" event', () => {
      jest.spyOn(spectator.component.deleteListItem, 'emit').mockImplementation();
      spectator.component.removeControlNext(undefined);
      expect(spectator.component.deleteListItem.emit).toHaveBeenCalledTimes(1);
    });
  });
});
