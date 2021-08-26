import * as _ from 'lodash';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';

const basicTypeData = [
  {
    name: 'should parse to "select" field if the schema has "enum" key',
    schema: {
      variable: 'variable',
      description: 'Please specify type of workload to deploy',
      label: 'Workload Type',
      schema: {
        type: 'string',
        default: 'Deployment',
        required: true,
        enum: [
          {
            value: 'Deployment',
            description: 'Deploy a Deployment workload',
          },
          {
            value: 'Job',
            description: 'Deploy job workload',
          },
        ],
      },
    },
    expectedFieldConfigs: [
      {
        required: true,
        value: 'Deployment',
        tooltip: 'Please specify type of workload to deploy',
        placeholder: 'Workload Type',
        name: 'variable',
        type: 'select',
        enableTextWrapForOptions: true,
        options: [
          { value: 'Deployment', label: 'Deploy a Deployment workload' },
          { value: 'Job', label: 'Deploy job workload' },
        ],
      },
    ],
  },
  {
    name: 'should parse to "checkbox" field if the schema type="boolean"',
    schema: {
      variable: 'hostNetwork',
      label: 'Provide access to node network namespace for the workload',
      group: 'Networking',
      schema: {
        type: 'boolean',
        default: false,
      },
    },
    expectedFieldConfigs: [
      {
        type: 'checkbox',
        name: 'hostNetwork',
        value: false,
        placeholder: 'Provide access to node network namespace for the workload',
      },
    ],
  },
  {
    name: 'should parse to "input" field if the schema type="path"',
    schema: {
      variable: 'mountPath',
      label: 'Mount Path',
      description: 'Path where host path will be mounted inside the pod',
      schema: {
        type: 'path',
        required: true,
      },
    },
    expectedFieldConfigs: [
      {
        name: 'mountPath',
        required: true,
        tooltip: 'Path where host path will be mounted inside the pod',
        placeholder: 'Mount Path',
        type: 'input',
      },
    ],
  },
  {
    name: 'should parse to "input" field if the schema type="string"',
    schema: {
      variable: 'repository',
      description: 'Docker image repository',
      label: 'Image repository',
      schema: {
        type: 'string',
        required: true,
      },
    },
    expectedFieldConfigs: [
      {
        name: 'repository',
        required: true,
        tooltip: 'Docker image repository',
        placeholder: 'Image repository',
        type: 'input',
      },
    ],
  },
  {
    name: 'should parse to "input(number)" field if the schema type="int"',
    schema: {
      variable: 'nodePort',
      label: 'Node Port',
      schema: {
        type: 'int',
        required: true,
        min: 9000,
        max: 65535,
      },
    },
    expectedFieldConfigs: [
      {
        name: 'nodePort',
        required: true,
        placeholder: 'Node Port',
        type: 'input',
        inputType: 'number',
        min: 9000,
        max: 65535,
      },
    ],
  },
  {
    name: 'should parse to "input(password)" field if the schema type="string(private=true)"',
    schema: {
      variable: 'repository',
      description: 'Enter the S3 access ID',
      label: 'Access Key',
      schema: {
        type: 'string',
        private: true,
        required: true,
        min_length: 5,
        max_length: 20,
      },
    },
    expectedFieldConfigs: [
      {
        name: 'repository',
        required: true,
        tooltip: 'Enter the S3 access ID',
        placeholder: 'Access Key',
        type: 'input',
        inputType: 'password',
        togglePw: true,
        min: 5,
        max: 20,
      },
    ],
  },
  {
    name: 'should parse to "ipwithnetmask" field if the schema type="ipaddr"',
    schema: {
      variable: 'staticIP',
      label: 'Static IP',
      schema: {
        type: 'ipaddr',
        cidr: true,
      },
    },
    expectedFieldConfigs: [
      {
        name: 'staticIP',
        placeholder: 'Static IP',
        type: 'ipwithnetmask',
      },
    ],
  },
  {
    name: 'should parse to "explorer" field if the schema type="hostpath"',
    schema: {
      variable: 'hostPath',
      label: 'Host Path',
      schema: {
        type: 'hostpath',
        required: true,
      },
    },
    expectedFieldConfigs: [
      {
        name: 'hostPath',
        required: true,
        placeholder: 'Host Path',
        type: 'explorer',
        explorerType: 'file',
        initial: '/mnt',
      },
    ],
  },
  {
    name: 'should parse to "list" field if the schema type="list"',
    schema: {
      variable: 'containerArgs',
      description: 'Specify arguments for container command',
      label: 'Container Args',
      group: 'Container Entrypoint',
      schema: {
        type: 'list',
        items: [
          {
            variable: 'arg',
            description: 'Container Arg',
            label: 'Arg',
            schema: {
              type: 'string',
            },
          },
        ],
      },
    },
    expectedFieldConfigs: [
      {
        name: 'containerArgs',
        tooltip: 'Specify arguments for container command',
        placeholder: 'Container Args',
        type: 'list',
        label: 'Configure Container Args',
        width: '100%',
        listFields: [] as FieldConfig[],
        templateListField: [
          {
            name: 'arg',
            tooltip: 'Container Arg',
            placeholder: 'Arg',
            type: 'input',
          },
        ],
      },
    ],
  },
  {
    name: 'should parse to "dict" field if the schema type="dict"',
    schema: {
      variable: 'environmentVariable',
      description: 'Container Environment Variable',
      label: 'Container Environment Variable',
      schema: {
        type: 'dict',
        attrs: [
          {
            variable: 'name',
            description: 'Environment Variable Name',
            label: 'Environment Variable Name',
            schema: {
              type: 'string',
              required: true,
            },
          },
          {
            variable: 'value',
            description: 'Environment Variable Value',
            label: 'Environment Variable Value',
            schema: {
              type: 'string',
              required: true,
            },
          },
        ],
      },
    },
    expectedFieldConfigs: [
      {
        name: 'environmentVariable',
        tooltip: 'Container Environment Variable',
        placeholder: 'Container Environment Variable',
        type: 'dict',
        label: 'Container Environment Variable',
        width: '100%',
        subFields: [
          {
            name: 'name',
            required: true,
            tooltip: 'Environment Variable Name',
            placeholder: 'Environment Variable Name',
            type: 'input',
          },
          {
            name: 'value',
            required: true,
            tooltip: 'Environment Variable Value',
            placeholder: 'Environment Variable Value',
            type: 'input',
          },
        ],
      },
    ],
  },
];

const nestedData = [
  {
    name: 'should parse dict-in-dict',
    schema: {
      variable: 'interfaceConfiguration',
      description: 'Interface Configuration',
      label: 'Interface Configuration',
      schema: {
        type: 'dict',
        attrs: [
          {
            variable: 'ipam',
            description: 'Define how IP Address will be managed',
            label: 'IP Address Management',
            schema: {
              type: 'dict',
              required: true,
              attrs: [
                {
                  variable: 'type',
                  description: 'Specify type for IPAM',
                  label: 'IPAM Type',
                  schema: {
                    type: 'string',
                    required: true,
                    enum: [
                      {
                        value: 'dhcp',
                        description: 'Use DHCP',
                      },
                      {
                        value: 'static',
                        description: 'Use static IP',
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
    expectedFieldConfigs: [
      {
        name: 'interfaceConfiguration',
        tooltip: 'Interface Configuration',
        placeholder: 'Interface Configuration',
        type: 'dict',
        label: 'Interface Configuration',
        width: '100%',
        subFields: [
          {
            name: 'ipam',
            required: true,
            tooltip: 'Define how IP Address will be managed',
            placeholder: 'IP Address Management',
            type: 'dict',
            label: 'IP Address Management',
            width: '100%',
            subFields: [
              {
                name: 'type',
                required: true,
                tooltip: 'Specify type for IPAM',
                placeholder: 'IPAM Type',
                type: 'select',
                enableTextWrapForOptions: true,
                options: [
                  { value: 'dhcp', label: 'Use DHCP' },
                  { value: 'static', label: 'Use static IP' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'should parse list-in-list',
    schema: {
      variable: 'containerArgs',
      description: 'Specify arguments for container command',
      label: 'Container Args',
      group: 'Container Entrypoint',
      schema: {
        type: 'list',
        items: [
          {
            variable: 'containerArgsInList',
            description: 'Specify arguments for container command in List',
            label: 'Container Args in List',
            schema: {
              type: 'list',
              items: [
                {
                  variable: 'argInList',
                  description: 'Container Arg in List',
                  label: 'Arg in List',
                  schema: {
                    type: 'string',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    expectedFieldConfigs: [
      {
        name: 'containerArgs',
        tooltip: 'Specify arguments for container command',
        placeholder: 'Container Args',
        type: 'list',
        label: 'Configure Container Args',
        width: '100%',
        listFields: [] as FieldConfig[],
        templateListField: [
          {
            name: 'containerArgsInList',
            tooltip: 'Specify arguments for container command in List',
            placeholder: 'Container Args in List',
            type: 'list',
            label: 'Configure Container Args in List',
            width: '100%',
            listFields: [] as FieldConfig[],
            templateListField: [
              {
                name: 'argInList',
                tooltip: 'Container Arg in List',
                placeholder: 'Arg in List',
                type: 'input',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'should parse dict-in-list',
    schema: {
      variable: 'containerEnvironmentVariables',
      description: 'Container Environment Variables',
      label: 'Container Environment Variables',
      group: 'Container Environment Variables',
      schema: {
        type: 'list',
        items: [
          {
            variable: 'environmentVariable',
            description: 'Container Environment Variable',
            label: 'Container Environment Variable',
            schema: {
              type: 'dict',
              attrs: [
                {
                  variable: 'name',
                  description: 'Environment Variable Name',
                  label: 'Environment Variable Name',
                  schema: {
                    type: 'string',
                    required: true,
                  },
                },
                {
                  variable: 'value',
                  description: 'Environment Variable Value',
                  label: 'Environment Variable Value',
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
    expectedFieldConfigs: [
      {
        name: 'containerEnvironmentVariables',
        tooltip: 'Container Environment Variables',
        placeholder: 'Container Environment Variables',
        type: 'list',
        label: 'Configure Container Environment Variables',
        width: '100%',
        listFields: [] as FieldConfig[],
        templateListField: [
          {
            name: 'environmentVariable',
            tooltip: 'Container Environment Variable',
            placeholder: 'Container Environment Variable',
            type: 'dict',
            label: 'Container Environment Variable',
            width: '100%',
            subFields: [
              {
                name: 'name',
                required: true,
                tooltip: 'Environment Variable Name',
                placeholder: 'Environment Variable Name',
                type: 'input',
              },
              {
                name: 'value',
                required: true,
                tooltip: 'Environment Variable Value',
                placeholder: 'Environment Variable Value',
                type: 'input',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'should parse list-in-dict',
    schema: {
      variable: 'livenessProbe',
      label: 'Liveness Probe',
      description: 'Configure Liveness Probe',
      group: 'Health Check',
      schema: {
        type: 'dict',
        null: true,
        attrs: [
          {
            variable: 'command',
            label: 'Liveness command',
            description: 'Specify a command to determine liveness of pod',
            schema: {
              type: 'list',
              required: true,
              items: [
                {
                  variable: 'commandArg',
                  label: 'Command Arg',
                  schema: {
                    type: 'string',
                  },
                },
              ],
            },
          },
          {
            variable: 'initialDelaySeconds',
            label: 'Seconds Delay',
            description: 'Seconds to delay the first liveness probe',
            schema: {
              type: 'int',
              default: 5,
            },
          },
          {
            variable: 'periodSeconds',
            label: 'Period Seconds',
            description: 'Specify number of seconds to run liveness probe',
            schema: {
              type: 'int',
              default: 10,
            },
          },
        ],
      },
    },
    expectedFieldConfigs: [
      {
        name: 'livenessProbe',
        tooltip: 'Configure Liveness Probe',
        placeholder: 'Liveness Probe',
        type: 'dict',
        label: 'Liveness Probe',
        width: '100%',
        subFields: [
          {
            name: 'command',
            required: true,
            tooltip: 'Specify a command to determine liveness of pod',
            placeholder: 'Liveness command',
            type: 'list',
            label: 'Configure Liveness command',
            width: '100%',
            listFields: [] as FieldConfig[],
            templateListField: [
              { name: 'commandArg', placeholder: 'Command Arg', type: 'input' },
            ],
          },
          {
            name: 'initialDelaySeconds',
            value: 5,
            tooltip: 'Seconds to delay the first liveness probe',
            placeholder: 'Seconds Delay',
            type: 'input',
            inputType: 'number',
          },
          {
            name: 'periodSeconds',
            value: 10,
            tooltip: 'Specify number of seconds to run liveness probe',
            placeholder: 'Period Seconds',
            type: 'input',
            inputType: 'number',
          },
        ],
      },
    ],
  },
];

const propertyData = [
  {
    name: 'should parse to "empty" if the schema has "hidden=true"',
    schema: {
      variable: 'variable',
      description: 'Please specify type of workload to deploy',
      label: 'Workload Type',
      schema: {
        type: 'string',
        hidden: true,
        default: 'Deployment',
        required: true,
        enum: [
          {
            value: 'Deployment',
            description: 'Deploy a Deployment workload',
          },
          {
            value: 'Job',
            description: 'Deploy job workload',
          },
        ],
      },
    },
    expectedFieldConfigs: [] as FieldConfig[],
  },
  {
    name: 'should parse to "readonly" if the schema has "editable=false"',
    schema: {
      variable: 'variable',
      description: 'Please specify type of workload to deploy',
      label: 'Workload Type',
      schema: {
        type: 'string',
        default: 'Deployment',
        editable: false,
        required: true,
        enum: [
          {
            value: 'Deployment',
            description: 'Deploy a Deployment workload',
          },
          {
            value: 'Job',
            description: 'Deploy job workload',
          },
        ],
      },
    },
    expectedFieldConfigs: [
      {
        required: true,
        value: 'Deployment',
        tooltip: 'Please specify type of workload to deploy',
        placeholder: 'Workload Type',
        name: 'variable',
        type: 'select',
        enableTextWrapForOptions: true,
        readonly: true,
        options: [
          { value: 'Deployment', label: 'Deploy a Deployment workload' },
          { value: 'Job', label: 'Deploy job workload' },
        ],
      },
    ],
  },
];

const relationData = [
  {
    name: 'should parse "show_subquestions_if"',
    schema: {
      variable: 'type',
      description: 'Specify type for IPAM',
      label: 'IPAM Type',
      schema: {
        type: 'string',
        required: true,
        enum: [
          {
            value: 'dhcp',
            description: 'Use DHCP',
          },
          {
            value: 'static',
            description: 'Use static IP',
          },
        ],
        show_subquestions_if: 'static',
        subquestions: [
          {
            variable: 'staticIPConfigurations',
            label: 'Static IP Addresses',
            schema: {
              type: 'list',
              items: [
                {
                  variable: 'staticIP',
                  label: 'Static IP',
                  schema: {
                    type: 'ipaddr',
                    cidr: true,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    expectedFieldConfigs: [
      {
        name: 'type',
        required: true,
        tooltip: 'Specify type for IPAM',
        placeholder: 'IPAM Type',
        type: 'select',
        enableTextWrapForOptions: true,
        options: [
          { value: 'dhcp', label: 'Use DHCP' },
          { value: 'static', label: 'Use static IP' },
        ],
      },
      {
        name: 'staticIPConfigurations',
        placeholder: 'Static IP Addresses',
        type: 'list',
        label: 'Configure Static IP Addresses',
        width: '100%',
        listFields: [] as FieldConfig[],
        templateListField: [
          {
            name: 'staticIP',
            placeholder: 'Static IP',
            type: 'ipwithnetmask',
          },
        ],
        isHidden: true,
        relation: [
          {
            action: 'SHOW',
            when: [{ name: 'type', value: 'static' }],
          },
        ],
      },
    ],
  },
  {
    name: 'should parse "show_if"',
    schema: {
      variable: 'updateStrategy',
      description: 'Upgrade Policy',
      label: 'Update Strategy',
      group: 'Scaling/Upgrade Policy',
      schema: {
        type: 'string',
        show_if: [
          ['workloadType', '=', 'Deployment'],
        ],
        default: 'RollingUpdate',
        enum: [
          {
            value: 'RollingUpdate',
            description: 'Create new pods and then kill old ones',
          },
          {
            value: 'Recreate',
            description: 'Kill existing pods before creating new ones',
          },
        ],
      },
    },
    expectedFieldConfigs: [
      {
        name: 'updateStrategy',
        value: 'RollingUpdate',
        tooltip: 'Upgrade Policy',
        placeholder: 'Update Strategy',
        type: 'select',
        enableTextWrapForOptions: true,
        options: [
          {
            value: 'RollingUpdate',
            label: 'Create new pods and then kill old ones',
          },
          {
            value: 'Recreate',
            label: 'Kill existing pods before creating new ones',
          },
        ],
        relation: [
          {
            action: 'SHOW',
            when: [{ name: 'workloadType', operator: '=', value: 'Deployment' }],
          },
        ],
      },
    ],
  },
];

const unsupportedTypeData = {
  variable: 'cronSchedule',
  label: 'Cron Schedule',
  group: 'Workload Details',
  schema: {
    type: 'cron',
    default: {
      minute: '5',
    },
  },
};

describe('parseSchemaFieldConfig', () => {
  const utils = new EntityUtils();

  describe.each(basicTypeData)('parse the basic types', (item) => {
    it(item.name, () => {
      const result = utils.parseSchemaFieldConfig(item.schema);
      const isEqual = _.isEqual(item.expectedFieldConfigs, result);
      expect(isEqual).toBe(true);
    });
  });

  describe.each(nestedData)('parse the nested data', (item) => {
    it(item.name, () => {
      const result = utils.parseSchemaFieldConfig(item.schema);
      const isEqual = _.isEqual(item.expectedFieldConfigs, result);
      expect(isEqual).toBe(true);
    });
  });

  describe.each(propertyData)('parse the property(hidden, readonly)', (item) => {
    it(item.name, () => {
      const result = utils.parseSchemaFieldConfig(item.schema);
      const isEqual = _.isEqual(item.expectedFieldConfigs, result);
      expect(isEqual).toBe(true);
    });
  });

  describe.each(relationData)('parse the relations', (item) => {
    it(item.name, () => {
      const result = utils.parseSchemaFieldConfig(item.schema);
      const isEqual = _.isEqual(item.expectedFieldConfigs, result);
      expect(isEqual).toBe(true);
    });
  });

  describe('parse unexpected type', () => {
    it('should return empty and show error on console', () => {
      const originalError = console.error;
      console.error = jest.fn();

      const result = utils.parseSchemaFieldConfig(unsupportedTypeData);
      const isEqual = _.isEqual([], result);
      expect(isEqual).toBe(true);
      expect(console.error).toHaveBeenCalled();
      console.error = originalError;
    });
  });
});
