import {
  FormArray, FormControl, FormGroup, ReactiveFormsModule,
} from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { CodeEditorLanguage } from 'app/enums/code-editor-language.enum';
import {
  DynamicFormSchemaInput,
  DynamicFormSchemaList,
  DynamicFormSchemaSelect,
  DynamicFormSchemaCheckbox,
  DynamicFormSchemaIpaddr,
  DynamicFormSchemaExplorer,
  DynamicFormSchemaDict,
  DynamicFormSchemaText,
} from 'app/interfaces/dynamic-form-schema.interface';
import { Option } from 'app/interfaces/option.interface';
import { CustomUntypedFormField } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untyped-form-field';
import { IxDynamicFormItemComponent } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/ix-dynamic-form-item/ix-dynamic-form-item.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxCodeEditorComponent } from 'app/modules/forms/ix-forms/components/ix-code-editor/ix-code-editor.component';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxIpInputWithNetmaskComponent } from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';

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
  list: new FormArray([
    new FormGroup({
      input: new FormControl(''),
      select: new FormControl(''),
    }),
  ]),
  text: new FormControl(''),
});

const inputSchema = {
  controlName: 'input',
  editable: true,
  inputType: 'password',
  required: true,
  title: 'Label Input',
  tooltip: 'Tooltip Input',
  type: 'input',
} as DynamicFormSchemaInput;

const selectSchema = {
  controlName: 'select',
  editable: undefined,
  hideEmpty: true,
  required: true,
  title: 'Label Select',
  tooltip: 'Tooltip Select',
  options: of<Option[]>([]),
  type: 'select',
} as DynamicFormSchemaSelect;

const checkboxSchema = {
  controlName: 'checkbox',
  editable: undefined,
  indent: true,
  required: false,
  title: 'Label Checkbox',
  tooltip: 'Tooltip Checkbox',
  type: 'checkbox',
} as DynamicFormSchemaCheckbox;

const ipaddrSchema = {
  controlName: 'ipaddr',
  editable: undefined,
  required: true,
  title: 'Label Ipaddr',
  tooltip: 'Tooltip Ipaddr',
  type: 'ipaddr',
} as DynamicFormSchemaIpaddr;

const explorerSchema = {
  controlName: 'explorer',
  tooltip: 'Tooltip Explorer',
  required: true,
  type: 'explorer',
} as DynamicFormSchemaExplorer;

const listSchema = {
  controlName: 'list',
  title: 'Label List',
  type: 'list',
  items: [
    inputSchema,
    selectSchema,
  ],
  itemsSchema: [],
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

const textSchema = {
  controlName: 'text',
  editable: true,
  required: true,
  title: 'Label Text',
  placeholder: 'Text placeholder',
  tooltip: 'Tooltip Text',
  language: CodeEditorLanguage.Json,
  type: 'text',
} as DynamicFormSchemaText;

describe('IxDynamicFormItemComponent', () => {
  let spectator: Spectator<IxDynamicFormItemComponent>;
  const createComponent = createComponentFactory({
    component: IxDynamicFormItemComponent,
    imports: [
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponent(IxErrorsComponent),
      MockComponent(IxLabelComponent),
      MockComponent(IxInputComponent),
      MockComponent(IxListComponent),
      MockComponent(IxCodeEditorComponent),
      MockComponent(IxListItemComponent),
      MockComponent(IxSelectComponent),
      MockComponent(IxCheckboxComponent),
      MockComponent(IxIpInputWithNetmaskComponent),
      MockComponent(IxExplorerComponent),
      CastPipe,
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  describe('Component rendering', () => {
    it('renders an "ix-input" when schema with "input" type is supplied', () => {
      spectator = createComponent({
        props: {
          dynamicForm,
          dynamicSchema: inputSchema,
        },
      });
      expect(spectator.query('ix-input')).toBeVisible();
      expect(spectator.query(IxInputComponent).required).toBe(inputSchema.required);
      expect(spectator.query(IxInputComponent).type).toBe(inputSchema.inputType);
      expect(spectator.query(IxInputComponent).tooltip).toBe(inputSchema.tooltip);

      expect(spectator.query('ix-input')).not.toBeHidden();
      const field = spectator.component.dynamicForm.controls.input as CustomUntypedFormField;
      if (!field.hidden$) {
        field.hidden$ = new BehaviorSubject<boolean>(false);
      }
      field.hidden$.next(true);
      spectator.detectComponentChanges();
      expect(spectator.query('ix-input')).toBeHidden();
    });

    it('renders an "ix-dynamic-form-item" when schema with "text" type is supplied', () => {
      spectator = createComponent({
        props: {
          dynamicForm,
          dynamicSchema: textSchema,
        },
      });
      expect(spectator.query('ix-code-editor')).toBeVisible();
      expect(spectator.query(IxCodeEditorComponent).required).toBe(textSchema.required);
      expect(spectator.query(IxCodeEditorComponent).tooltip).toBe(textSchema.tooltip);
      expect(spectator.query('ix-code-editor')).not.toBeHidden();
      const field = spectator.component.dynamicForm.controls.text as CustomUntypedFormField;
      if (!field.hidden$) {
        field.hidden$ = new BehaviorSubject<boolean>(false);
      }
      field.hidden$.next(true);
      spectator.detectComponentChanges();
      expect(spectator.query('ix-code-editor')).toBeHidden();
    });

    it('renders an "ix-select" when schema with "select" type is supplied', () => {
      spectator = createComponent({
        props: {
          dynamicForm,
          dynamicSchema: selectSchema,
        },
      });
      expect(spectator.query('ix-select')).toBeVisible();
      expect(spectator.query(IxSelectComponent).required).toBe(selectSchema.required);
      expect(spectator.query(IxSelectComponent).hideEmpty).toBe(selectSchema.hideEmpty);
      expect(spectator.query(IxSelectComponent).tooltip).toBe(selectSchema.tooltip);

      expect(spectator.query('ix-select')).not.toBeHidden();
      const field = spectator.component.dynamicForm.controls.select as CustomUntypedFormField;
      if (!field.hidden$) {
        field.hidden$ = new BehaviorSubject<boolean>(false);
      }
      field.hidden$.next(true);
      spectator.detectComponentChanges();
      expect(spectator.query('ix-select')).toBeHidden();
    });

    it('renders an "ix-checkbox" when schema with "checkbox" type is supplied', () => {
      spectator = createComponent({
        props: {
          dynamicForm,
          dynamicSchema: checkboxSchema,
        },
      });
      expect(spectator.query('ix-checkbox')).toBeVisible();
      expect(spectator.query(IxCheckboxComponent).required).toBe(checkboxSchema.required);
      expect(spectator.query(IxCheckboxComponent).tooltip).toBe(checkboxSchema.tooltip);

      expect(spectator.query('ix-checkbox')).not.toBeHidden();
      const field = spectator.component.dynamicForm.controls.checkbox as CustomUntypedFormField;
      if (!field.hidden$) {
        field.hidden$ = new BehaviorSubject<boolean>(false);
      }
      field.hidden$.next(true);
      spectator.detectComponentChanges();
      expect(spectator.query('ix-checkbox')).toBeHidden();
    });

    it('renders an "ix-ip-input-with-netmask" when schema with "ipaddr" type is supplied', () => {
      spectator = createComponent({
        props: {
          dynamicForm,
          dynamicSchema: ipaddrSchema,
        },
      });
      expect(spectator.query('ix-ip-input-with-netmask')).toBeVisible();
      expect(spectator.query(IxIpInputWithNetmaskComponent).required).toBe(ipaddrSchema.required);
      expect(spectator.query(IxIpInputWithNetmaskComponent).tooltip).toBe(ipaddrSchema.tooltip);

      expect(spectator.query('ix-ip-input-with-netmask')).not.toBeHidden();
      const field = spectator.component.dynamicForm.controls.ipaddr as CustomUntypedFormField;
      if (!field.hidden$) {
        field.hidden$ = new BehaviorSubject<boolean>(false);
      }
      field.hidden$.next(true);
      spectator.detectComponentChanges();
      expect(spectator.query('ix-ip-input-with-netmask')).toBeHidden();
    });

    it('renders an "ix-explorer" when schema with "explorer" type is supplied', () => {
      spectator = createComponent({
        props: {
          dynamicForm,
          dynamicSchema: explorerSchema,
        },
      });
      expect(spectator.query('ix-explorer')).toBeVisible();
      expect(spectator.query(IxExplorerComponent).required).toBe(explorerSchema.required);
      expect(spectator.query(IxExplorerComponent).tooltip).toBe(explorerSchema.tooltip);

      expect(spectator.query('ix-explorer')).not.toBeHidden();
      const field = spectator.component.dynamicForm.controls.explorer as CustomUntypedFormField;
      if (!field.hidden$) {
        field.hidden$ = new BehaviorSubject<boolean>(false);
      }
      field.hidden$.next(true);
      spectator.detectComponentChanges();
      expect(spectator.query('ix-explorer')).toBeHidden();
    });

    it('renders an "ix-list" when schema with "list" type is supplied', () => {
      spectator = createComponent({
        props: {
          dynamicForm,
          dynamicSchema: listSchema,
        },
      });
      expect(spectator.query('ix-list')).toBeVisible();
      expect(spectator.queryAll('ix-list-item')).toHaveLength(1);
      expect(spectator.queryAll('ix-dynamic-form-item')).toHaveLength(listSchema.items.length);
      expect(spectator.query(IxListComponent).empty).toBe(false);
      expect(spectator.query(IxListComponent).label).toBe(listSchema.title);

      expect(spectator.query('ix-list')).not.toBeHidden();
      const field = spectator.component.dynamicForm.controls.list as CustomUntypedFormField;
      if (!field.hidden$) {
        field.hidden$ = new BehaviorSubject<boolean>(false);
      }
      field.hidden$.next(true);
      spectator.detectComponentChanges();
      expect(spectator.query('ix-list')).toBeHidden();
    });

    it('renders an "ix-dynamic-form-item" when schema with "dict" type is supplied', () => {
      spectator = createComponent({
        props: {
          dynamicForm,
          dynamicSchema: dictSchema,
        },
      });
      expect(spectator.query('.label')).toHaveText('Label Dict');
      expect(spectator.queryAll('ix-dynamic-form-item')).toHaveLength(dictSchema.attrs.length);

      spectator.queryAll(IxListItemComponent).forEach((item) => {
        expect(item).not.toBeHidden();
      });

      const field = spectator.component.dynamicForm.controls.dict as CustomUntypedFormField;
      if (!field.hidden$) {
        field.hidden$ = new BehaviorSubject<boolean>(false);
      }
      field.hidden$.next(true);
      spectator.detectComponentChanges();

      spectator.queryAll('ix-dynamic-form-item').forEach((item) => {
        expect(item).toBeHidden();
      });
    });
  });

  describe('Component methods', () => {
    it('emits "addListItem" when "(add)" is emitted by a list control', () => {
      spectator = createComponent({
        props: {
          dynamicForm,
          dynamicSchema: listSchema,
        },
      });

      const field = spectator.component.dynamicForm.controls.list as CustomUntypedFormField;
      if (!field.hidden$) {
        field.hidden$ = new BehaviorSubject<boolean>(false);
      }
      field.hidden$.next(false);
      spectator.detectComponentChanges();

      jest.spyOn(spectator.component.addListItem, 'emit').mockImplementation();
      spectator.query(IxListComponent).add.emit([]);

      expect(spectator.component.addListItem.emit).toHaveBeenCalledWith({
        array: dynamicForm.controls.list,
        schema: listSchema.itemsSchema,
      });
    });

    it('emits "deleteListItem" when "(delete)" is emitted by a list control', () => {
      spectator = createComponent({
        props: {
          dynamicForm,
          dynamicSchema: listSchema,
        },
      });

      const field = spectator.component.dynamicForm.controls.list as CustomUntypedFormField;
      if (!field.hidden$) {
        field.hidden$ = new BehaviorSubject<boolean>(false);
      }
      field.hidden$.next(false);
      spectator.detectComponentChanges();

      jest.spyOn(spectator.component.deleteListItem, 'emit').mockImplementation();
      expect(spectator.queryAll(IxListItemComponent)).toHaveLength(1);
      spectator.query(IxListItemComponent).delete.emit();

      expect(spectator.component.deleteListItem.emit).toHaveBeenCalledWith({
        array: dynamicForm.controls.list,
        index: 0,
      });
    });

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
