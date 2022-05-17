import { FormGroup } from '@ngneat/reactive-forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DynamicFormSchemaNode } from 'app/interfaces/dynamic-form-schema.interface';
import { IxDynamicFormItemComponent } from 'app/modules/ix-forms/components/ix-dynamic-form/ix-dynamic-form-item/ix-dynamic-form-item.component';

const dynamicForm = {
  controls: {
    options: {
      controls: [],
      disabled: true,
    },
  },
} as unknown as FormGroup<Record<string, any>>;

const dynamicSchema = {
  controlName: 'options',
  type: 'list',
  title: 'DNS Options',
  items: [
    {
      controlName: 'name',
      type: 'input',
      title: 'Option Name',
      required: true,
    },
    {
      controlName: 'value',
      type: 'input',
      title: 'Option Value',
      required: true,
    },
  ],
  itemsSchema: [
    {
      variable: 'name',
      label: 'Option Name',
      schema: {
        type: 'string',
        required: true,
      },
    },
    {
      variable: 'value',
      label: 'Option Value',
      schema: {
        type: 'string',
        required: true,
      },
    },
  ],
} as DynamicFormSchemaNode;

describe('IxDynamicFormItemComponent', () => {
  let spectator: Spectator<IxDynamicFormItemComponent>;
  const createComponent = createComponentFactory({
    component: IxDynamicFormItemComponent,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('isHidden', () => {
    spectator.component.dynamicForm = dynamicForm;
    spectator.component.dynamicSchema = dynamicSchema;
    expect(spectator.component.isHidden).toBeTruthy();
  });

  it('getFormArray', () => {
    spectator.component.dynamicForm = dynamicForm;
    spectator.component.dynamicSchema = dynamicSchema;
    expect(spectator.component.getFormArray).toEqual({ controls: [], disabled: true });
  });

  describe('Control Emit', () => {
    it('addControl()', () => {
      spectator.component.dynamicForm = dynamicForm;
      spectator.component.dynamicSchema = dynamicSchema;

      jest.spyOn(spectator.component.addListItem, 'emit').mockImplementation();
      spectator.component.addControl();
      expect(spectator.component.addListItem.emit).toHaveBeenCalledTimes(1);
    });
    it('removeControl()', () => {
      spectator.component.dynamicForm = dynamicForm;
      spectator.component.dynamicSchema = dynamicSchema;

      jest.spyOn(spectator.component.deleteListItem, 'emit').mockImplementation();
      spectator.component.removeControl(1);
      expect(spectator.component.deleteListItem.emit).toHaveBeenCalledTimes(1);
    });

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
