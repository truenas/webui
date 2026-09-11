import { ElementRef, signal } from '@angular/core';
import {
  FormArray, FormControl, FormGroup, ReactiveFormsModule, UntypedFormGroup,
} from '@angular/forms';
import { TreeComponent } from '@bugsplat/angular-tree-component';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import {
  InputType, TnCheckboxComponent, TnFormFieldComponent, TnFormListComponent, TnFormListItemComponent, TnInputComponent,
} from '@truenas/ui-components';
import { MockInstance } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CodeEditorLanguage } from 'app/enums/code-editor-language.enum';
import { ChartSchemaNode } from 'app/interfaces/app.interface';
import {
  DynamicFormSchemaInput,
  DynamicFormSchemaList,
  DynamicFormSchemaSelect,
  DynamicFormSchemaCheckbox,
  DynamicFormSchemaIpaddr,
  DynamicFormSchemaExplorer,
  DynamicFormSchemaDict,
  DynamicFormSchemaText, AddListItemEvent, DeleteListItemEvent,
} from 'app/interfaces/dynamic-form-schema.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxCodeEditorComponent } from 'app/modules/forms/controls/ix-code-editor/ix-code-editor.component';
import { IxIpInputWithNetmaskComponent } from 'app/modules/forms/controls/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import {
  CustomUntypedFormArray,
} from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untped-form-array';
import { CustomUntypedFormField } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untyped-form-field';
import { IxDynamicFormItemComponent } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/ix-dynamic-form-item/ix-dynamic-form-item.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';

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
    providers: [
      mockAuth(),
    ],
  });

  beforeEach(() => {
    // TODO: Workaround for https://github.com/help-me-mom/ng-mocks/issues/8634
    MockInstance(IxCodeEditorComponent, 'inputArea', signal({} as ElementRef));
    MockInstance(IxExplorerComponent, 'tree', signal({} as TreeComponent));
  });

  describe('Component rendering', () => {
    it('renders a "tn-input" when schema with "input" type is supplied', () => {
      spectator = createComponent({
        props: {
          dynamicForm,
          dynamicSchema: inputSchema,
        },
      });
      expect(spectator.query('tn-input')).toBeVisible();
      expect(spectator.query(TnInputComponent)!.required()).toBe(inputSchema.required);
      expect(spectator.query(TnInputComponent)!.inputType()).toBe(InputType.Password);
      expect(spectator.query(TnFormFieldComponent)!.tooltip()).toBe(inputSchema.tooltip);

      expect(spectator.query('tn-input')).not.toBeHidden();
      const field = spectator.component.dynamicForm().controls.input as CustomUntypedFormField;
      if (!field.hidden$) {
        field.hidden$ = new BehaviorSubject<boolean>(false);
      }
      field.hidden$.next(true);
      spectator.detectComponentChanges();
      expect(spectator.query('tn-input')).toBeHidden();
    });

    it('renders an "ix-dynamic-form-item" when schema with "text" type is supplied', () => {
      spectator = createComponent({
        props: {
          dynamicForm,
          dynamicSchema: textSchema,
        },
      });
      expect(spectator.query('ix-code-editor')).toBeVisible();
      // The label row belongs to the wrapping `tn-form-field` now, so `required`/`tooltip` are
      // asserted there rather than on the bare control.
      const textField = spectator.query(TnFormFieldComponent)!;
      expect(textField.required()).toBe(textSchema.required);
      expect(textField.tooltip()).toBe(textSchema.tooltip);
      expect(spectator.query('ix-code-editor')).not.toBeHidden();
      const field = spectator.component.dynamicForm()!.controls.text as CustomUntypedFormField;
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
      expect(spectator.query('tn-select')).toBeVisible();
      expect(spectator.query(TnFormFieldComponent)!.required()).toBe(selectSchema.required);
      expect(spectator.query(TnFormFieldComponent)!.tooltip()).toBe(selectSchema.tooltip);

      expect(spectator.query('tn-select')).not.toBeHidden();
      const field = spectator.component.dynamicForm()!.controls.select as CustomUntypedFormField;
      if (!field.hidden$) {
        field.hidden$ = new BehaviorSubject<boolean>(false);
      }
      field.hidden$.next(true);
      spectator.detectComponentChanges();
      expect(spectator.query('tn-select')).toBeHidden();
    });

    it('renders an "ix-checkbox" when schema with "checkbox" type is supplied', () => {
      spectator = createComponent({
        props: {
          dynamicForm,
          dynamicSchema: checkboxSchema,
        },
      });
      expect(spectator.query('tn-checkbox')).toBeVisible();
      expect(spectator.query(TnCheckboxComponent)!.required()).toBe(checkboxSchema.required);
      expect(spectator.query(TnFormFieldComponent)!.tooltip()).toBe(checkboxSchema.tooltip);

      expect(spectator.query('tn-checkbox')).not.toBeHidden();
      const field = spectator.component.dynamicForm()!.controls.checkbox as CustomUntypedFormField;
      if (!field.hidden$) {
        field.hidden$ = new BehaviorSubject<boolean>(false);
      }
      field.hidden$.next(true);
      spectator.detectComponentChanges();
      expect(spectator.query('tn-checkbox')).toBeHidden();
    });

    it('renders an "ix-ip-input-with-netmask" when schema with "ipaddr" type is supplied', () => {
      spectator = createComponent({
        props: {
          dynamicForm,
          dynamicSchema: ipaddrSchema,
        },
      });
      expect(spectator.query('ix-ip-input-with-netmask')).toBeVisible();
      // `required` stays on the control as well: it renders the native attribute on the address
      // input, where the field only renders the asterisk.
      expect(spectator.query(IxIpInputWithNetmaskComponent)!.required()).toBe(ipaddrSchema.required);
      const ipField = spectator.query(TnFormFieldComponent)!;
      expect(ipField.required()).toBe(ipaddrSchema.required);
      expect(ipField.tooltip()).toBe(ipaddrSchema.tooltip);

      expect(spectator.query('ix-ip-input-with-netmask')).not.toBeHidden();
      const field = spectator.component.dynamicForm()!.controls.ipaddr as CustomUntypedFormField;
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
      expect(spectator.query(IxExplorerComponent)!.required()).toBe(explorerSchema.required);
      expect(spectator.query(IxExplorerComponent)!.tooltip()).toBe(explorerSchema.tooltip);

      expect(spectator.query('ix-explorer')).not.toBeHidden();
      const field = spectator.component.dynamicForm()!.controls.explorer as CustomUntypedFormField;
      if (!field.hidden$) {
        field.hidden$ = new BehaviorSubject<boolean>(false);
      }
      field.hidden$.next(true);
      spectator.detectComponentChanges();
      expect(spectator.query('ix-explorer')).toBeHidden();
    });

    it('renders a "tn-form-list" when schema with "list" type is supplied', () => {
      spectator = createComponent({
        props: {
          dynamicForm,
          dynamicSchema: listSchema,
        },
      });
      expect(spectator.query('tn-form-list')).toBeVisible();
      expect(spectator.queryAll('tn-form-list-item')).toHaveLength(1);
      expect(spectator.queryAll('ix-dynamic-form-item')).toHaveLength(listSchema.items!.length);
      expect(spectator.query(TnFormListComponent)!.empty()).toBe(false);
      expect(spectator.query(TnFormListComponent)!.label()).toBe(listSchema.title);

      expect(spectator.query('tn-form-list')).not.toBeHidden();
      const field = spectator.component.dynamicForm()!.controls.list as CustomUntypedFormField;
      if (!field.hidden$) {
        field.hidden$ = new BehaviorSubject<boolean>(false);
      }
      field.hidden$.next(true);
      spectator.detectComponentChanges();
      expect(spectator.query('tn-form-list')).toBeHidden();
    });

    it('renders an "ix-dynamic-form-item" when schema with "dict" type is supplied', () => {
      spectator = createComponent({
        props: {
          dynamicForm,
          dynamicSchema: dictSchema,
        },
      });
      expect(spectator.query('.label')).toHaveText('Label Dict');
      expect(spectator.queryAll('ix-dynamic-form-item')).toHaveLength(dictSchema.attrs!.length);

      spectator.queryAll(TnFormListItemComponent).forEach((item) => {
        expect(item).not.toBeHidden();
      });

      const field = spectator.component.dynamicForm()!.controls.dict as CustomUntypedFormField;
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

      const field = spectator.component.dynamicForm()!.controls.list as CustomUntypedFormField;
      if (!field.hidden$) {
        field.hidden$ = new BehaviorSubject<boolean>(false);
      }
      field.hidden$.next(false);
      spectator.detectComponentChanges();

      jest.spyOn(spectator.component.addListItem, 'emit').mockImplementation();
      spectator.query(TnFormListComponent)!.add.emit([]);

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

      const field = spectator.component.dynamicForm()!.controls.list as CustomUntypedFormField;
      if (!field.hidden$) {
        field.hidden$ = new BehaviorSubject<boolean>(false);
      }
      field.hidden$.next(false);
      spectator.detectComponentChanges();

      jest.spyOn(spectator.component.deleteListItem, 'emit').mockImplementation();
      expect(spectator.queryAll(TnFormListItemComponent)).toHaveLength(1);
      spectator.query(TnFormListItemComponent)!.delete.emit();

      expect(spectator.component.deleteListItem.emit).toHaveBeenCalledWith({
        array: dynamicForm.controls.list,
        index: 0,
      });
    });

    it('forwarding "addListItem" event', () => {
      jest.spyOn(spectator.component.addListItem, 'emit').mockImplementation();
      spectator.component.addControlNext({} as AddListItemEvent);
      expect(spectator.component.addListItem.emit).toHaveBeenCalledTimes(1);
    });

    it('forwarding "deleteListItem" event', () => {
      jest.spyOn(spectator.component.deleteListItem, 'emit').mockImplementation();
      spectator.component.removeControlNext({} as DeleteListItemEvent);
      expect(spectator.component.deleteListItem.emit).toHaveBeenCalledTimes(1);
    });
  });
  /**
   * The seeding that used to live in `ix-list`. `tn-form-list` knows nothing about chart schemas,
   * so the component that owns the schema does it now — these cover the three ways it declines.
   */
  describe('seeding a list schema\'s defaults', () => {
    const itemsSchema = [
      { variable: 'input', schema: { type: 'string' } },
      { variable: 'select', schema: { type: 'string', default: 'fallback' } },
    ] as ChartSchemaNode[];

    function createListComponent(
      overrides: Partial<DynamicFormSchemaList>,
      isEditMode = false,
      form: UntypedFormGroup = dynamicForm as unknown as UntypedFormGroup,
    ): void {
      spectator = createComponent({
        props: {
          dynamicForm: form,
          dynamicSchema: { ...listSchema, itemsSchema, ...overrides } as DynamicFormSchemaList,
          isEditMode,
        },
      });
      // Seeding is deferred a macrotask past AfterViewInit, so the spy is in place before it runs.
      jest.spyOn(spectator.component.addListItem, 'emit').mockImplementation();
    }

    async function flushSeeding(): Promise<void> {
      await new Promise((resolve) => {
        setTimeout(resolve);
      });
    }

    it('adds one row per default, carrying that row\'s values into the item schema', async () => {
      createListComponent({ default: [{ input: 'first' }, { input: 'second' }] });
      await flushSeeding();

      expect(spectator.component.addListItem.emit).toHaveBeenCalledTimes(2);
      expect(spectator.component.addListItem.emit).toHaveBeenNthCalledWith(1, {
        array: dynamicForm.controls.list,
        schema: [
          { variable: 'input', schema: { type: 'string', default: 'first' } },
          // Untouched by this default, so the item schema's own default stands.
          { variable: 'select', schema: { type: 'string', default: 'fallback' } },
        ],
      });
    });

    it('seeds nothing on an edit form, where the saved rows come from the value', async () => {
      createListComponent({ default: [{ input: 'first' }] }, true);
      await flushSeeding();

      expect(spectator.component.addListItem.emit).not.toHaveBeenCalled();
    });

    // The template sits under `@if (!(isHidden$ | async))`, so a list that starts hidden never
    // rendered an `ix-list` to run this, and its defaults never reached the payload.
    it('seeds nothing for a schema that starts hidden', async () => {
      createListComponent({ default: [{ input: 'first' }], hidden: true });
      await flushSeeding();

      expect(spectator.component.addListItem.emit).not.toHaveBeenCalled();
    });

    /**
     * The case the static flag misses: `show_if` relations and subquestions hide a question by
     * pushing to `hidden$` and disabling the control, leaving `schema.hidden` false. Seeding one
     * would also re-enable the array — `push` re-runs `_setInitialStatus` — so its invisible rows
     * would be submitted.
     */
    it('seeds nothing for a list a relation has hidden, where the static flag stays false', async () => {
      const list = new CustomUntypedFormArray([]);
      list.hidden$.next(true);
      list.disable();
      const relationHiddenForm = new UntypedFormGroup({ list });

      createListComponent({ default: [{ input: 'first' }] }, false, relationHiddenForm);
      await flushSeeding();

      expect(spectator.component.addListItem.emit).not.toHaveBeenCalled();
      expect(list.disabled).toBe(true);
    });

    it('seeds nothing when the schema carries no defaults', async () => {
      createListComponent({});
      await flushSeeding();

      expect(spectator.component.addListItem.emit).not.toHaveBeenCalled();
    });
  });
});
