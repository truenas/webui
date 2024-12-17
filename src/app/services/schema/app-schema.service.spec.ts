import { FormArray, FormControl, UntypedFormGroup } from '@angular/forms';
import { FormGroup } from '@ngneat/reactive-forms';
import { Observable } from 'rxjs';
import { ChartSchemaType } from 'app/enums/chart-schema-type.enum';
import { ChartSchemaNode } from 'app/interfaces/app.interface';
import {
  DynamicFormSchemaCheckbox,
  DynamicFormSchemaDict,
  DynamicFormSchemaInput,
  DynamicFormSchemaList,
  DynamicFormSchemaIpaddr,
  DynamicFormSchemaCron,
  DynamicFormSchemaUri,
  DynamicWizardSchema,
  DynamicFormSchemaEnum,
} from 'app/interfaces/dynamic-form-schema.interface';
import { FilesystemService } from 'app/services/filesystem.service';
import { AppSchemaService } from 'app/services/schema/app-schema.service';
import { UrlValidationService } from 'app/services/url-validation.service';

const beforeIntString = [{
  variable: 'variable_dict',
  description: 'Description Dict',
  label: 'Label Dict',
  group: 'Group Dict',
  schema: {
    type: 'dict',
    required: true,
    attrs: [
      {
        variable: 'variable_input_int_with_default',
        label: 'Label Input Int With Default',
        schema: {
          type: 'int',
          default: 9401,
          required: true,
        },
      },
      {
        variable: 'variable_input_string_with_default',
        schema: {
          type: 'string',
          default: 'test input string',
          required: false,
          private: true,
        },
      },
      {
        variable: 'variable_input_int_without_default',
        label: 'Label Input Int Without Default',
        schema: {
          type: 'int',
        },
      },
      {
        variable: 'variable_input_string_without_default',
        label: 'Label Input String Without Default',
        schema: {
          type: 'string',
        },
      },
    ],
  },
}] as ChartSchemaNode[];

const afterIntString = [[{
  attrs: [{
    controlName: 'variable_input_int_with_default',
    inputType: 'number',
    required: true,
    title: 'Label Input Int With Default',
    type: 'input',
    editable: undefined,
    tooltip: undefined,
  }, {
    controlName: 'variable_input_string_with_default',
    inputType: 'password',
    required: false,
    type: 'input',
    editable: undefined,
    title: undefined,
    tooltip: undefined,
  }, {
    controlName: 'variable_input_int_without_default',
    inputType: 'number',
    title: 'Label Input Int Without Default',
    type: 'input',
    editable: undefined,
    required: false,
    tooltip: undefined,
  }, {
    controlName: 'variable_input_string_without_default',
    title: 'Label Input String Without Default',
    type: 'input',
    editable: undefined,
    inputType: undefined,
    required: false,
    tooltip: undefined,
  }] as DynamicFormSchemaInput[],
  controlName: 'variable_dict',
  tooltip: 'Description Dict',
  title: 'Label Dict',
  type: 'dict',
  editable: undefined,
}]] as DynamicFormSchemaDict[][];

const beforeEnum = [{
  variable: 'variable_dict',
  description: 'Description Dict',
  label: 'Label Dict',
  group: 'Group Dict',
  schema: {
    type: 'dict',
    required: true,
    attrs: [
      {
        variable: 'variable_select_int',
        label: 'Label Select Int',
        schema: {
          type: 'int',
          default: 'test1',
          required: true,
          enum: [{ value: 1, description: 'test1' }],
        },
      },
      {
        variable: 'variable_select_string',
        label: 'Label Select String',
        schema: {
          type: 'string',
          default: 1,
          required: false,
          enum: [],
        },
      },
    ],
  },
}] as ChartSchemaNode[];

const afterEnum = [[{
  attrs: [{
    controlName: 'variable_select_int',
    required: true,
    title: 'Label Select Int',
    options: expect.any(Observable),
    type: 'enum',
  }, {
    controlName: 'variable_select_string',
    required: false,
    title: 'Label Select String',
    options: expect.any(Observable),
    type: 'enum',
  }] as DynamicFormSchemaEnum[],
  controlName: 'variable_dict',
  tooltip: 'Description Dict',
  title: 'Label Dict',
  type: 'dict',
}]] as DynamicFormSchemaDict[][];

const beforeBoolean = [{
  variable: 'variable_boolean',
  label: 'Label Boolean',
  schema: {
    type: 'boolean',
    show_subquestions_if: true,
    subquestions: [
      {
        variable: 'variable_subquestion_boolean',
        label: 'Label Subquestion Boolean',
        schema: {
          type: 'boolean',
          default: true,
        },
      },
    ],
  },
}] as ChartSchemaNode[];

const afterBoolean = [[{
  controlName: 'variable_boolean',
  title: 'Label Boolean',
  type: 'checkbox',
  editable: undefined,
  required: false,
  tooltip: undefined,
}, {
  controlName: 'variable_subquestion_boolean',
  dependsOn: ['variable_boolean'],
  indent: true,
  title: 'Label Subquestion Boolean',
  type: 'checkbox',
  editable: undefined,
  required: false,
  tooltip: undefined,
}]] as DynamicFormSchemaCheckbox[][];

const beforeUri = [{
  variable: 'variable_uri',
  label: 'Label Uri',
  schema: {
    type: 'uri',
    default: 'https://google.com',
  },
}] as ChartSchemaNode[];

const afterUri = [[{
  controlName: 'variable_uri',
  title: 'Label Uri',
  type: 'uri',
  editable: undefined,
  inputType: undefined,
  required: false,
  tooltip: undefined,
}]] as DynamicFormSchemaUri[][];

const beforeCron = [{
  variable: 'variable_cron',
  label: 'Label Cron',
  schema: {
    type: 'cron',
    default: {
      hour: '*',
      minute: '*',
      month: '*',
      dom: '*',
      dow: '*',
    },
  },
}] as ChartSchemaNode[];

const afterCron = [[{
  controlName: 'variable_cron',
  title: 'Label Cron',
  type: 'cron',
  editable: undefined,
  required: false,
  tooltip: undefined,
}]] as DynamicFormSchemaCron[][];

const beforePath = [{
  variable: 'variable_path',
  label: 'Label Path',
  schema: {
    type: 'path',
  },
}] as ChartSchemaNode[];

const afterPath = [[{
  controlName: 'variable_path',
  title: 'Label Path',
  type: 'input',
  editable: undefined,
  required: false,
  tooltip: undefined,
}]] as DynamicFormSchemaInput[][];

const beforeList = [{
  variable: 'variable_list',
  label: 'Label List',
  schema: {
    type: 'list',
    default: [
      { item_list_1: 'prefilled_1', item_list_2: 2 },
    ],
    items: [
      {
        variable: 'item_list_1',
        label: '',
        schema: {
          type: 'string',
        },
      },
      {
        variable: 'item_list_2',
        label: '',
        schema: {
          type: 'int',
        },
      },
    ],
  },
}] as ChartSchemaNode[];

const afterList = [[{
  controlName: 'variable_list',
  items: [{
    controlName: 'item_list_1',
    title: '',
    type: 'input',
    editable: undefined,
    inputType: undefined,
    required: false,
    tooltip: undefined,
  }, {
    controlName: 'item_list_2',
    inputType: 'number',
    title: '',
    type: 'input',
    editable: undefined,
    required: false,
    tooltip: undefined,
  }],
  itemsSchema: [
    { label: '', schema: { type: 'string' }, variable: 'item_list_1' },
    { label: '', schema: { type: 'int' }, variable: 'item_list_2' },
  ],
  title: 'Label List',
  default: [
    { item_list_1: 'prefilled_1', item_list_2: 2 },
  ],
  type: 'list',
  dependsOn: undefined,
  editable: undefined,
  required: false,
  tooltip: undefined,
}]] as DynamicFormSchemaList[][];

const beforeIpaddr = [{
  variable: 'staticIP',
  label: 'Static IP',
  schema: {
    type: 'ipaddr',
    cidr: true,
  },
}] as ChartSchemaNode[];

const afterIpaddr = [[{
  controlName: 'staticIP',
  title: 'Static IP',
  type: 'ipaddr',
  editable: undefined,
  required: false,
  tooltip: undefined,
}]] as DynamicFormSchemaIpaddr[][];

const beforeHidden = [{
  variable: 'hidden_field',
  label: 'Hidden Field',
  schema: {
    type: 'string',
    default: 'hidden_field',
    hidden: true,
    show_if: [['if_field', '=', true]],
  },
}] as ChartSchemaNode[];

const afterHidden = [[]] as DynamicFormSchemaIpaddr[][];

const dynamicForm = new FormGroup<Record<string, UntypedFormGroup>>({});

describe('AppSchemaService', () => {
  const service = new AppSchemaService({} as FilesystemService, {} as UrlValidationService);
  describe('transformNode()', () => {
    beforeIntString.forEach((item, idx) => {
      it('converts schema with "int" and "string" type', () => {
        const transformed = service.transformNode(item, true, false);
        expect(transformed).toEqual(afterIntString[idx]);
      });
    });
    beforeEnum.forEach((item, idx) => {
      it('converts schema with "enum" parameter', () => {
        const transformed = service.transformNode(item, true, false);
        expect(transformed).toEqual(afterEnum[idx]);
      });
    });
    beforeBoolean.forEach((item, idx) => {
      it('converts schema with "boolean" type', () => {
        const transformed = service.transformNode(item, true, false);
        expect(transformed).toEqual(afterBoolean[idx]);
      });
    });
    beforePath.forEach((item, idx) => {
      it('converts schema with "path" type', () => {
        const transformed = service.transformNode(item, true, false);
        expect(transformed).toEqual(afterPath[idx]);
      });
    });
    beforeCron.forEach((item, idx) => {
      it('converts schema with "cron" type', () => {
        const transformed = service.transformNode(item, true, false);
        expect(transformed).toEqual(afterCron[idx]);
      });
    });
    beforeUri.forEach((item, idx) => {
      it('converts schema with "uri" type', () => {
        const transformed = service.transformNode(item, true, false);
        expect(transformed).toEqual(afterUri[idx]);
      });
    });
    beforeList.forEach((item, idx) => {
      it('converts schema with "list" type', () => {
        const transformed = service.transformNode(item, true, false);
        expect(transformed).toEqual(afterList[idx]);
      });
    });
    beforeIpaddr.forEach((item, idx) => {
      it('converts schema with "ipaddr" type', () => {
        const transformed = service.transformNode(item, true, false);
        expect(transformed).toEqual(afterIpaddr[idx]);
      });
    });
    beforeHidden.forEach((item, idx) => {
      it('converts schema for hidden field', () => {
        const transformed = service.transformNode(item, true, false);
        expect(transformed).toEqual(afterHidden[idx]);
      });
    });
  });
  describe('addFormControls()', () => {
    beforeIntString.forEach((item) => {
      service.getNewFormControlChangesSubscription({
        chartSchemaNode: item,
        formGroup: dynamicForm,
        config: null,
        isNew: true,
        isParentImmutable: false,
      });
    });

    it('creates form for "int" with default value', () => {
      expect(dynamicForm.controls.variable_dict.controls.variable_input_int_with_default.value).toBe(9401);
    });
    it('creates form for "string" with default value', () => {
      expect(dynamicForm.controls.variable_dict.controls.variable_input_string_with_default.value).toBe('test input string');
    });
    it('creates form for "boolean" with default value', () => {
      expect(dynamicForm.controls.variable_subquestion_boolean.value).toBe(true);
    });
    it('creates form for "int" without default value', () => {
      expect(dynamicForm.controls.variable_dict.controls.variable_input_int_without_default.value).toBeNull();
    });
    it('creates form for "string" without default value', () => {
      expect(dynamicForm.controls.variable_dict.controls.variable_input_string_without_default.value).toBe('');
    });
    it('creates form for "boolean" without default value', () => {
      expect(dynamicForm.controls.variable_boolean.value).toBe(false);
    });

    beforeUri.forEach((item) => {
      service.getNewFormControlChangesSubscription({
        chartSchemaNode: item,
        formGroup: dynamicForm,
        config: null,
        isNew: true,
        isParentImmutable: false,
      });
    });

    it('creates form for "uri" with default value', () => {
      expect(dynamicForm.controls.variable_uri.value).toBe('https://google.com');
    });

    beforeCron.forEach((item) => {
      service.getNewFormControlChangesSubscription({
        chartSchemaNode: item,
        formGroup: dynamicForm,
        config: null,
        isNew: true,
        isParentImmutable: false,
      });
    });

    it('creates form for "cron" with default value', () => {
      expect(dynamicForm.controls.variable_cron.value).toBe('* * * * *');
    });

    beforeBoolean.forEach((item) => {
      service.getNewFormControlChangesSubscription({
        chartSchemaNode: item,
        formGroup: dynamicForm,
        config: null,
        isNew: true,
        isParentImmutable: false,
      });
    });

    it('creates form for "boolean"', () => {
      expect(dynamicForm.controls.variable_boolean.value).toBe(false);
      expect(dynamicForm.controls.variable_subquestion_boolean.value).toBe(true);
    });

    beforeList.forEach((item) => {
      service.getNewFormControlChangesSubscription({
        chartSchemaNode: item,
        formGroup: dynamicForm,
        config: null,
        isNew: true,
        isParentImmutable: false,
      });
    });

    it('creates form for "list"', () => {
      expect(dynamicForm.controls.variable_list.value).toEqual([]);
    });

    beforeHidden.forEach((item) => {
      service.getNewFormControlChangesSubscription({
        chartSchemaNode: item,
        formGroup: dynamicForm,
        config: null,
        isNew: true,
        isParentImmutable: false,
      });
    });

    it('creates form for hidden field', () => {
      expect(dynamicForm.controls.hidden_field.value).toBe('hidden_field');
      expect(dynamicForm.controls.hidden_field.disabled).toBe(true);
      expect(dynamicForm.controls.if_field).toBeUndefined();
    });
  });
  describe('serializeFormValue()', () => {
    it('serialization validation', () => {
      expect(service.serializeFormValue(undefined, null)).toBeUndefined();
      expect(service.serializeFormValue(true, null)).toBe(true);
      expect(service.serializeFormValue(1, null)).toBe(1);
      expect(service.serializeFormValue('1', null)).toBe('1');
      expect(service.serializeFormValue('', null)).toBe('');
      expect(service.serializeFormValue('test', null)).toBe('test');
      expect(service.serializeFormValue(12, null)).toBe(12);
      expect(service.serializeFormValue({}, null)).toEqual({});
      expect(service.serializeFormValue([], null)).toEqual([]);
      expect(service.serializeFormValue([{ a: 1 }, { a: 2 }, { a: 3 }], null)).toEqual([1, 2, 3]);
      expect(service.serializeFormValue({ a: 1 }, null)).toEqual({ a: 1 });
      expect(service.serializeFormValue({ a: { b: [{ c: 'test' }] } }, null)).toEqual({ a: { b: ['test'] } });
      expect(service.serializeFormValue({ a: { b: 1 } }, null)).toEqual({ a: { b: 1 } });
      expect(service.serializeFormValue({ a: { c: null, d: 'test' }, b: null }, null)).toEqual({ a: { d: 'test' } });
      expect(service.serializeFormValue({
        commonName: [
          { commonName: [{ entry: 'list of' }] },
          { commonName: [{ entry: 'lists' }, { entry: 'of strings' }] },
          { commonName: [{ number: 5 }] },
        ],
      }, null)).toEqual({ commonName: [['list of'], ['lists', 'of strings'], [5]] });
      expect(service.serializeFormValue({ a: { c: null, d: 'test' }, b: null }, {
        questions: [
          {
            schema: {
              type: ChartSchemaType.Int,
              null: true,
            },
            label: 'c',
            variable: 'c',
          },
          {
            schema: {
              type: ChartSchemaType.Int,
              null: false,
            },
            label: 'b',
            variable: 'b',
          },
        ],
        groups: [],
        portals: {},
      })).toEqual({ a: { c: null, d: 'test' } });
      expect(service.serializeFormValue({
        topContainer: {
          items: [{ itemKey1: 'item-key-1', itemKey2: 'item-key-2' }],
          otherItemsSameNestedName: [
            { items: [{ item: 'same-name-1' }] },
            { items: [{ item: 'same-name-2' }] },
          ],
          otherItemsDifferentNestedName: [{ itemsDifferent: [{ item: 'different-name-1' }, { item: 'different-name-2' }] }],
        },
      }, {
        questions: [
          {
            variable: 'topContainer',
            label: '',
            group: 'Radarr Configuration',
            schema: {
              type: 'dict',
              attrs: [
                {
                  variable: 'items',
                  label: 'Items',
                  schema: {
                    type: 'list',
                    default: [],
                    items: [
                      {
                        variable: 'someEntry',
                        label: 'someEntry',
                        schema: {
                          type: 'dict',
                          attrs: [
                            {
                              variable: 'itemKey1',
                              label: 'itemKey1',
                              schema: {
                                type: 'string',
                                default: '',
                                required: true,
                              },
                            },
                            {
                              variable: 'itemKey2',
                              label: 'itemKey2',
                              schema: {
                                type: 'string',
                                default: '',
                                required: true,
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  variable: 'otherItemsSameNestedName',
                  label: 'otherItemsSameNestedName',
                  schema: {
                    type: 'list',
                    default: [],
                    items: [
                      {
                        variable: 'otherEntry',
                        label: 'otherEntry',
                        schema: {
                          type: 'dict',
                          attrs: [
                            {
                              variable: 'items',
                              label: 'items',
                              schema: {
                                type: 'list',
                                default: [],
                                items: [
                                  {
                                    variable: 'item',
                                    label: 'Item',
                                    schema: {
                                      type: 'string',
                                      default: '',
                                      required: true,
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  variable: 'otherItemsDifferentNestedName',
                  label: 'otherItemsDifferentNestedName',
                  schema: {
                    type: 'list',
                    default: [],
                    items: [
                      {
                        variable: 'otherEntry',
                        label: 'otherEntry',
                        schema: {
                          type: 'dict',
                          attrs: [
                            {
                              variable: 'itemsDifferent',
                              label: 'itemsDifferent',
                              schema: {
                                type: 'list',
                                default: [],
                                items: [
                                  {
                                    variable: 'item',
                                    label: 'Item',
                                    schema: {
                                      type: 'string',
                                      default: '',
                                      required: true,
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ] as ChartSchemaNode[],
        groups: [],
        portals: {},
      })).toStrictEqual({
        topContainer: {
          items: [{ itemKey1: 'item-key-1', itemKey2: 'item-key-2' }],
          otherItemsSameNestedName: [{ items: ['same-name-1'] }, { items: ['same-name-2'] }],
          otherItemsDifferentNestedName: [{ itemsDifferent: ['different-name-1', 'different-name-2'] }],
        },
      });
    });

    it('always serializes dictionaries in lists as objects', () => {
      const nodeSchema = {
        schema: {
          type: 'list',
          items: [
            {
              schema: {
                type: 'dict',
              },
            },
          ],
        },
      } as ChartSchemaNode;

      expect(service.serializeFormValue([{ a: 1 }, { a: 2 }, { a: 3 }], null, nodeSchema))
        .toEqual([{ a: 1 }, { a: 2 }, { a: 3 }]);
    });

    it('serializes crontab value correctly', () => {
      expect(
        service.serializeFormValue(
          { cron_test: '* * * * *' },
          {
            groups: [],
            portals: {},
            questions: [
              {
                variable: 'cron_test',
                label: 'schedule_cron_type',
                schema: {
                  type: ChartSchemaType.Cron,
                },
              },
            ],
          },
        ),
      ).toEqual({
        cron_test: {
          hour: '*',
          minute: '*',
          month: '*',
          dom: '*',
          dow: '*',
        },
      });
    });
  });

  describe('restoreKeysFromFormGroup()', () => {
    it('restores keys from form group', () => {
      const config = {
        noObjectList: ['test1', 'test2', 'test3'],
        objectList: [{ nestedList: ['test4', 'test5'] }],
        object: { nestedList: ['test6', 'test7'] },
        cron_test: {
          hour: '*',
          minute: '*',
          month: '*',
          dom: '*',
          dow: '*',
        },
      };
      const form = new FormGroup({
        noObjectList: new FormArray([
          new FormControl({ key1: '' }),
          new FormControl({ key1: '' }),
          new FormControl({ key1: '' }),
        ]),
        objectList: new FormArray([
          new FormGroup({
            nestedList: new FormArray([
              new FormControl({ key2: '' }),
              new FormControl({ key2: '' }),
            ]),
          }),
        ]),
        object: new FormGroup({
          nestedList: new FormArray([
            new FormControl({ key3: '' }),
            new FormControl({ key3: '' }),
          ]),
        }),
        cron_test: new FormControl('* * * * *'),
      });
      const result = service.restoreKeysFromFormGroup(config, form);
      expect(result).toEqual({
        noObjectList: [{ key1: 'test1' }, { key1: 'test2' }, { key1: 'test3' }],
        objectList: [{ nestedList: [{ key2: 'test4' }, { key2: 'test5' }] }],
        object: { nestedList: [{ key3: 'test6' }, { key3: 'test7' }] },
        cron_test: '* * * * *',
      });
    });
  });

  describe('getSearchOptions()', () => {
    it('get search options from dynamic schema', () => {
      const dinamicSchema = [
        {
          schema: [
            { controlName: 'control_name_1', title: 'Title 1', type: 'input' },
            { controlName: 'control_name_2', title: 'Title 2', type: 'input' },
          ],
        },
        {
          schema: [
            { controlName: 'control_name_3', title: 'Title 3', type: 'input' },
            {
              controlName: 'control_name_4',
              title: 'Title 4',
              type: 'dict',
              attrs: [
                { controlName: 'control_name_5', title: 'Title 5', type: 'input' },
                {
                  controlName: 'control_name_6',
                  title: 'Title 6',
                  type: 'dict',
                  attrs: [{ controlName: 'control_name_7', title: 'Title 7', type: 'input' }],
                },
              ],
            },
          ],
        },
      ] as DynamicWizardSchema[];
      const formValue = {
        control_name_1: '',
        control_name_2: '',
        control_name_3: '',
        control_name_4: { control_name_5: '', control_name_6: { control_name_7: '' } },
      };
      const options = service.getSearchOptions(dinamicSchema, formValue);
      expect(options).toEqual([
        { label: 'Title 1', value: 'control_name_1' },
        { label: 'Title 2', value: 'control_name_2' },
        { label: 'Title 3', value: 'control_name_3' },
        { label: 'Title 5', value: 'control_name_4.control_name_5' },
        { label: 'Title 7', value: 'control_name_4.control_name_6.control_name_7' },
      ]);
    });
  });
});
