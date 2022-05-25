import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormArray, FormControl, FormGroup } from '@ngneat/reactive-forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import {
  DynamicFormSchemaInput,
  DynamicFormSchemaList,
  DynamicFormSchemaSelect,
  DynamicFormSchemaCheckbox,
  DynamicFormSchemaIpaddr,
  DynamicFormSchemaExplorer,
  DynamicFormSchemaDict,
} from 'app/interfaces/dynamic-form-schema.interface';
import { IxCheckboxComponent } from 'app/modules/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxDynamicFormItemComponent } from 'app/modules/ix-forms/components/ix-dynamic-form/ix-dynamic-form-item/ix-dynamic-form-item.component';
import { IxExplorerComponent } from 'app/modules/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxInputComponent } from 'app/modules/ix-forms/components/ix-input/ix-input.component';
import { IxIpInputWithNetmaskComponent } from 'app/modules/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxListComponent } from 'app/modules/ix-forms/components/ix-list/ix-list.component';
import { IxSelectComponent } from 'app/modules/ix-forms/components/ix-select/ix-select.component';

const dynamicForm = new FormGroup({
  dict: new FormGroup({
    input: new FormControl(''),
    select: new FormControl(''),
    checkbox: new FormControl(true),
  }),
  input: new FormControl(''),
  select: new FormControl(''),
  checkbox: new FormControl(true),
  ipaddr: new FormControl(''),
  explorer: new FormControl(''),
  list: new FormArray([]),
});

const inputSchema = {
  controlName: 'input',
  editable: true,
  number: true,
  private: false,
  required: true,
  title: 'Label Input Int',
  tooltip: undefined,
  type: 'input',
} as DynamicFormSchemaInput;

const selectSchema = {
  controlName: 'select',
  editable: undefined,
  hideEmpty: true,
  required: true,
  title: 'Label Select',
  tooltip: undefined,
  options: of([]),
  type: 'select',
} as DynamicFormSchemaSelect;

const checkboxSchema = {
  controlName: 'checkbox',
  editable: undefined,
  indent: true,
  required: undefined,
  title: 'Label Checkbox',
  tooltip: undefined,
  type: 'checkbox',
} as DynamicFormSchemaCheckbox;

const ipaddrSchema = {
  controlName: 'ipaddr',
  editable: undefined,
  required: undefined,
  title: 'Static IP',
  tooltip: undefined,
  type: 'ipaddr',
} as DynamicFormSchemaIpaddr;

const explorerSchema = {
  controlName: 'explorer',
  type: 'explorer',
} as DynamicFormSchemaExplorer;

const listSchema = {
  controlName: 'list',
  type: 'list',
} as DynamicFormSchemaList;

const dictSchema = {
  controlName: 'dict',
  title: 'Label Dict',
  hidden: false,
  attrs: [
    inputSchema,
    selectSchema,
    checkboxSchema,
  ],
  type: 'dict',
} as DynamicFormSchemaDict;

describe('IxDynamicFormItemComponent', () => {
  let spectator: Spectator<IxDynamicFormItemComponent>;
  const createComponent = createComponentFactory({
    component: IxDynamicFormItemComponent,
    imports: [
      FormsModule,
      ReactiveFormsModule,
      FlexLayoutModule,
    ],
    declarations: [
      MockComponent(IxInputComponent),
      MockComponent(IxListComponent),
      MockComponent(IxSelectComponent),
      MockComponent(IxCheckboxComponent),
      MockComponent(IxIpInputWithNetmaskComponent),
      MockComponent(IxExplorerComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  describe('UI tests', () => {
    it('input', () => {
      spectator.component.dynamicForm = dynamicForm;
      spectator.component.dynamicSchema = inputSchema;
      spectator.detectComponentChanges();
      expect(spectator.query('ix-input')).toBeVisible();
      expect(spectator.query('ix-input')).not.toBeDisabled();

      expect(spectator.query('ix-input')).not.toBeHidden();
      spectator.component.dynamicForm.controls.input.disable();
      spectator.detectComponentChanges();
      expect(spectator.query('ix-input')).toBeHidden();
    });

    it('select', () => {
      spectator.component.dynamicForm = dynamicForm;
      spectator.component.dynamicSchema = selectSchema;
      spectator.detectComponentChanges();
      expect(spectator.query('ix-select')).toBeVisible();
      expect(spectator.query('ix-select')).not.toBeDisabled();

      expect(spectator.query('ix-select')).not.toBeHidden();
      spectator.component.dynamicForm.controls.select.disable();
      spectator.detectComponentChanges();
      expect(spectator.query('ix-select')).toBeHidden();
    });

    it('checkbox', () => {
      spectator.component.dynamicForm = dynamicForm;
      spectator.component.dynamicSchema = checkboxSchema;
      spectator.detectComponentChanges();
      expect(spectator.query('ix-checkbox')).toBeVisible();
      expect(spectator.query('ix-checkbox')).not.toBeDisabled();

      expect(spectator.query('ix-checkbox')).not.toBeHidden();
      spectator.component.dynamicForm.controls.checkbox.disable();
      spectator.detectComponentChanges();
      expect(spectator.query('ix-checkbox')).toBeHidden();
    });

    it('ipaddr', () => {
      spectator.component.dynamicForm = dynamicForm;
      spectator.component.dynamicSchema = ipaddrSchema;
      spectator.detectComponentChanges();
      expect(spectator.query('ix-ip-input-with-netmask')).toBeVisible();
      expect(spectator.query('ix-ip-input-with-netmask')).not.toBeDisabled();

      expect(spectator.query('ix-ip-input-with-netmask')).not.toBeHidden();
      spectator.component.dynamicForm.controls.ipaddr.disable();
      spectator.detectComponentChanges();
      expect(spectator.query('ix-ip-input-with-netmask')).toBeHidden();
    });

    it('explorer', () => {
      spectator.component.dynamicForm = dynamicForm;
      spectator.component.dynamicSchema = explorerSchema;
      spectator.detectComponentChanges();
      expect(spectator.query('ix-explorer')).toBeVisible();
      expect(spectator.query('ix-explorer')).not.toBeDisabled();

      expect(spectator.query('ix-explorer')).not.toBeHidden();
      spectator.component.dynamicForm.controls.explorer.disable();
      spectator.detectComponentChanges();
      expect(spectator.query('ix-explorer')).toBeHidden();
    });

    it('list', () => {
      spectator.component.dynamicForm = dynamicForm;
      spectator.component.dynamicSchema = listSchema;
      spectator.detectComponentChanges();
      expect(spectator.query('ix-list')).toBeVisible();
      expect(spectator.query('ix-list')).not.toBeDisabled();

      expect(spectator.query('ix-list')).not.toBeHidden();
      spectator.component.dynamicForm.controls.list.disable();
      spectator.detectComponentChanges();
      expect(spectator.query('ix-list')).toBeHidden();
    });

    it('dict', () => {
      spectator.component.dynamicForm = dynamicForm;
      spectator.component.dynamicSchema = dictSchema;
      spectator.detectComponentChanges();
      expect(spectator.query('.label')).toHaveText('Label Dict');

      expect(spectator.queryAll('ix-dynamic-form-item').length).toEqual(3);

      spectator.queryAll('ix-dynamic-form-item').forEach((item) => {
        expect(item).not.toBeDisabled();
        expect(item).not.toBeHidden();
      });

      spectator.component.dynamicForm.controls.dict.disable();
      spectator.detectComponentChanges();

      spectator.queryAll('ix-dynamic-form-item').forEach((item) => {
        expect(item).not.toBeDisabled();
        expect(item).toBeHidden();
      });
    });
  });

  describe('Component methods', () => {
    it('isHidden()', () => {
      dynamicForm.controls.list.disable();
      spectator.component.dynamicForm = dynamicForm;
      spectator.component.dynamicSchema = listSchema;
      expect(spectator.component.isHidden).toBeTruthy();
    });

    it('getFormArray()', () => {
      spectator.component.dynamicForm = dynamicForm;
      spectator.component.dynamicSchema = listSchema;
      expect(spectator.component.getFormArray).toEqual(dynamicForm.controls.list);
    });

    it('addControl()', () => {
      spectator.component.dynamicForm = dynamicForm;
      spectator.component.dynamicSchema = listSchema;

      jest.spyOn(spectator.component.addListItem, 'emit').mockImplementation();
      spectator.component.addControl();
      expect(spectator.component.addListItem.emit).toHaveBeenCalledTimes(1);
    });

    it('removeControl()', () => {
      spectator.component.dynamicForm = dynamicForm;
      spectator.component.dynamicSchema = listSchema;

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
