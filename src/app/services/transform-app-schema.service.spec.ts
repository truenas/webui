import { ChartSchemaNode } from 'app/interfaces/chart-release.interface';
import { DynamicFormSchemaNode } from 'app/interfaces/dynamic-form-schema.interface';
import { FilesystemService } from 'app/services/filesystem.service';
import { TransformAppSchemaService } from 'app/services/transform-app-schema.service';

const beforData = [
  {
    variable: 'dnsConfig',
    label: 'DNS Configuration',
    group: 'Advanced DNS Settings',
    schema: {
      type: 'dict',
      attrs: [
        {
          variable: 'options',
          label: 'DNS Options',
          schema: {
            type: 'list',
            items: [
              {
                variable: 'optionsEntry',
                label: 'Option Entry Configuration',
                schema: {
                  type: 'dict',
                  attrs: [
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
                },
              },
            ],
          },
        },
      ],
    },
  },
  {
    variable: 'service',
    description: 'IPFS Service Configuration',
    label: 'IPFS Service Configuration',
    group: 'IPFS Configuration',
    schema: {
      type: 'dict',
      required: true,
      attrs: [
        {
          variable: 'swarmPort',
          label: 'Swarm Port to use for IPFS (Public)',
          schema: {
            type: 'int',
            min: 9000,
            max: 65535,
            default: 9401,
            required: true,
          },
        },
        {
          variable: 'apiPort',
          label: 'API Port to use for IPFS (local)',
          schema: {
            type: 'int',
            min: 9000,
            max: 65535,
            default: 9501,
            required: true,
          },
        },
        {
          variable: 'gatewayPort',
          label: 'Gateway Port to use for IPFS (local)',
          schema: {
            type: 'int',
            min: 9000,
            max: 65535,
            default: 9880,
            required: true,
          },
        },
      ],
    },
  },
] as ChartSchemaNode[];

const afterData = [
  [{
    attrs: [{
      controlName: 'options',
      editable: undefined,
      hidden: undefined,
      items: [{
        controlName: 'name', editable: undefined, hidden: undefined, private: undefined, required: true, title: 'Option Name', tooltip: undefined, type: 'input',
      }, {
        controlName: 'value', editable: undefined, hidden: undefined, private: undefined, required: true, title: 'Option Value', tooltip: undefined, type: 'input',
      }],
      items_schema: [{ label: 'Option Name', schema: { required: true, type: 'string' }, variable: 'name' }, { label: 'Option Value', schema: { required: true, type: 'string' }, variable: 'value' }],
      title: 'DNS Options',
      type: 'list',
    }],
    controlName: 'dnsConfig',
    editable: undefined,
    hidden: undefined,
    title: 'DNS Configuration',
    type: 'dict',
  }],
  [{
    attrs: [{
      controlName: 'swarmPort', editable: undefined, hidden: undefined, private: undefined, required: true, title: 'Swarm Port to use for IPFS (Public)', tooltip: undefined, type: 'input',
    }, {
      controlName: 'apiPort', editable: undefined, hidden: undefined, private: undefined, required: true, title: 'API Port to use for IPFS (local)', tooltip: undefined, type: 'input',
    }, {
      controlName: 'gatewayPort', editable: undefined, hidden: undefined, private: undefined, required: true, title: 'Gateway Port to use for IPFS (local)', tooltip: undefined, type: 'input',
    }],
    controlName: 'service',
    editable: undefined,
    hidden: undefined,
    title: 'IPFS Service Configuration',
    type: 'dict',
  }],
] as DynamicFormSchemaNode[][];

describe('TransformAppSchemaService', () => {
  const service = new TransformAppSchemaService({} as FilesystemService);
  beforData.forEach((item, idx) => {
    it('Variable ' + item.variable, () => {
      const transformed = service.transformNode(item);
      expect(transformed).toEqual(afterData[idx]);
    });
  });
});
