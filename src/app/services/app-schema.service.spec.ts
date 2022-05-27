import { ChartSchemaNode } from 'app/interfaces/chart-release.interface';
import {
  DynamicFormSchemaCheckbox,
  DynamicFormSchemaDict,
  DynamicFormSchemaInput,
  DynamicFormSchemaSelect,
  DynamicFormSchemaList,
  DynamicFormSchemaIpaddr,
} from 'app/interfaces/dynamic-form-schema.interface';
import { AppSchemaService } from 'app/services/app-schema.service';
import { FilesystemService } from 'app/services/filesystem.service';

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
        variable: 'variable_input_int',
        label: 'Label Input Int',
        schema: {
          type: 'int',
          min: 9000,
          max: 65535,
          default: 9401,
          required: true,
        },
      },
      {
        variable: 'variable_input_string',
        label: 'Label Input String',
        schema: {
          type: 'string',
          default: 'test_input string',
          required: false,
          private: true,
        },
      },
    ],
  },
}] as ChartSchemaNode[];

const afterIntString = [[{
  attrs: [{
    controlName: 'variable_input_int',
    editable: undefined,
    inputType: 'number',
    required: true,
    title: 'Label Input Int',
    tooltip: undefined,
    type: 'input',
  }, {
    controlName: 'variable_input_string',
    editable: undefined,
    inputType: 'password',
    required: false,
    title: 'Label Input String',
    tooltip: undefined,
    type: 'input',
  }] as DynamicFormSchemaInput[],
  controlName: 'variable_dict',
  editable: undefined,
  title: 'Label Dict',
  type: 'dict',
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
          enum: [
            {
              value: 1,
              description: 'test1',
            },
            {
              value: 2,
              description: 'test2',
            },
          ],
        },
      },
      {
        variable: 'variable_select_string',
        label: 'Label Select String',
        schema: {
          type: 'string',
          default: 1,
          required: false,
          enum: [
            {
              value: 'test1',
              description: 'test1',
            },
            {
              value: 'test2',
              description: 'test2',
            },
          ],
        },
      },
    ],
  },
}] as ChartSchemaNode[];

const afterEnum = [[{
  attrs: [{
    controlName: 'variable_select_int',
    editable: undefined,
    hideEmpty: true,
    required: true,
    title: 'Label Select Int',
    tooltip: undefined,
    options: {
      _isScalar: false,
      _subscribe: expect.any(Function),
    },
    type: 'select',
  }, {
    controlName: 'variable_select_string',
    editable: undefined,
    hideEmpty: true,
    required: false,
    title: 'Label Select String',
    tooltip: undefined,
    options: {
      _isScalar: false,
      _subscribe: expect.any(Function),
    },
    type: 'select',
  }] as DynamicFormSchemaSelect[],
  controlName: 'variable_dict',
  editable: undefined,
  title: 'Label Dict',
  type: 'dict',
}]] as DynamicFormSchemaDict[][];

const beforeBoolean = [{
  variable: 'variable_boolean',
  label: 'Label Boolean',
  schema: {
    type: 'boolean',
    default: false,
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
  editable: undefined,
  required: undefined,
  title: 'Label Boolean',
  tooltip: undefined,
  type: 'checkbox',
}, {
  controlName: 'variable_subquestion_boolean',
  dependsOn: ['variable_boolean'],
  editable: undefined,
  indent: true,
  required: undefined,
  title: 'Label Subquestion Boolean',
  tooltip: undefined,
  type: 'checkbox',
}]] as DynamicFormSchemaCheckbox[][];

const beforePath = [{
  variable: 'variable_path',
  label: 'Label Path',
  schema: {
    type: 'path',
  },
}] as ChartSchemaNode[];

const afterPath = [[{
  controlName: 'variable_path',
  editable: undefined,
  required: undefined,
  title: 'Label Path',
  tooltip: undefined,
  type: 'input',
}]] as DynamicFormSchemaInput[][];

const beforeList = [{
  variable: 'variable_list',
  label: 'Label List',
  schema: {
    type: 'list',
    default: [],
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
  dependsOn: undefined,
  editable: undefined,
  items: [{
    controlName: 'item_list_1',
    editable: undefined,
    inputType: undefined,
    required: undefined,
    title: '',
    tooltip: undefined,
    type: 'input',
  }, {
    controlName: 'item_list_2',
    editable: undefined,
    inputType: 'number',
    required: undefined,
    title: '',
    tooltip: undefined,
    type: 'input',
  }],
  itemsSchema: [
    { label: '', schema: { type: 'string' }, variable: 'item_list_1' },
    { label: '', schema: { type: 'int' }, variable: 'item_list_2' },
  ],
  title: 'Label List',
  type: 'list',
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
  editable: undefined,
  required: undefined,
  title: 'Static IP',
  tooltip: undefined,
  type: 'ipaddr',
}]] as DynamicFormSchemaIpaddr[][];

describe('AppSchemaService', () => {
  const service = new AppSchemaService({} as FilesystemService);
  describe('transformNode()', () => {
    beforeIntString.forEach((item, idx) => {
      it('converts schema with "int" and "string" type', () => {
        const transformed = service.transformNode(item);
        expect(transformed).toEqual(afterIntString[idx]);
      });
    });
    beforeEnum.forEach((item, idx) => {
      it('converts schema with "emum" parameter', () => {
        const transformed = service.transformNode(item);
        expect(transformed).toEqual(afterEnum[idx]);
      });
    });
    beforeBoolean.forEach((item, idx) => {
      it('converts schema with "boolean" type', () => {
        const transformed = service.transformNode(item);
        expect(transformed).toEqual(afterBoolean[idx]);
      });
    });
    beforePath.forEach((item, idx) => {
      it('converts schema with "path" type', () => {
        const transformed = service.transformNode(item);
        expect(transformed).toEqual(afterPath[idx]);
      });
    });
    beforeList.forEach((item, idx) => {
      it('converts schema with "list" type', () => {
        const transformed = service.transformNode(item);
        expect(transformed).toEqual(afterList[idx]);
      });
    });
    beforeIpaddr.forEach((item, idx) => {
      it('converts schema with "ipaddr" type', () => {
        const transformed = service.transformNode(item);
        expect(transformed).toEqual(afterIpaddr[idx]);
      });
    });
  });
});
