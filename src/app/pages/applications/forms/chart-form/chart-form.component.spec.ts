import { EventEmitter } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import {
  ChartFormValue, ChartRelease, ChartSchemaNodeConf,
} from 'app/interfaces/chart-release.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { ChartFormComponent } from 'app/pages/applications/forms/chart-form/chart-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('ChartFormComponent', () => {
  let spectator: Spectator<ChartFormComponent>;

  const mockDialogRef = {
    componentInstance: {
      setDescription: jest.fn(),
      setCall: jest.fn(),
      submit: jest.fn(),
      success: new EventEmitter(),
      failure: new EventEmitter(),
    },
    close: jest.fn(),
  } as unknown as MatDialogRef<EntityJobComponent>;

  const existingChartCreate = {
    name: 'ipfs',
    versions: {
      ['1.2.1' as string]: {
        healthy: true,
      },
    },
    catalog: {
      id: 'OFFICIAL',
      train: 'charts',
    },
    schema: {
      groups: [
        {
          description: 'Configure networking for container',
          name: 'Networking',
        },
        {
          description: 'Configure ports to forward to workload',
          name: 'Port Forwarding',
        },
        {
          description: 'Define mechanism to periodically probe the container to ensure it\'s functioning as desired',
          name: 'Health Check',
        },
        {
          description: 'Configure how workload should be deployed',
          name: 'Workload Details',
        },
        {
          description: 'Configure how pods are replaced when configuration is upgraded',
          name: 'Scaling/Upgrade Policy',
        },
        {
          description: 'Configure when pod should be restarted in case of failure',
          name: 'Restart Policy',
        },
        {
          name: 'IPFS Configuration',
          description: 'Configure Storage for IPFS',
        },
      ],
      questions: [
        {
          description: 'Please specify type of workload to deploy',
          group: 'Workload Details',
          label: 'Workload Type',
          schema: {
            default: 'Deployment',
            enum: [
              {
                description: 'Deploy a Deployment workload',
                value: 'Deployment',
              },
            ],
            hidden: true,
            required: true,
            type: 'string',
          } as ChartSchemaNodeConf,
          variable: 'workloadType',
        },
        {
          description: 'Upgrade Policy',
          group: 'Scaling/Upgrade Policy',
          label: 'Update Strategy',
          schema: {
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
            show_if: [
              ['workloadType', '=', 'Deployment'],
            ],
            type: 'string',
          },
          variable: 'updateStrategy',
        },
        {
          description: 'Restart Policy for workload',
          group: 'Restart Policy',
          label: 'Restart Policy',
          schema: {
            default: 'OnFailure',
            enum: [],
            hidden: true,
            show_if: [
              ['workloadType', '!=', 'Deployment'],
            ],
            type: 'string',
          },
          variable: 'jobRestartPolicy',
        },
        {
          description: 'Add External Interfaces',
          group: 'Networking',
          label: 'Add external Interfaces',
          schema: {
            show_if: [
              ['updateStrategy', '!=', 'Recreate'],
            ],
            type: 'list',
            items: [
              {
                variable: 'interfaceConfiguration',
                label: 'Interface Configuration',
                schema: {
                  $ref: ['normalize/interfaceConfiguration'],
                  type: 'dict',
                  attrs: [],
                },
              },
            ],
          },
          variable: 'externalInterfaces',
        },
        {
          group: 'Networking',
          label: 'Provide access to node network namespace for the workload',
          schema: {
            default: false,
            show_if: [
              ['externalInterfaces', '=', []],
            ],
            type: 'boolean',
          },
          variable: 'hostNetwork',
        },
        {
          description: 'Specify ports of node and workload to forward traffic from node port to workload port',
          group: 'Port Forwarding',
          label: 'Specify Node ports to forward to workload',
          schema: {
            items: [],
            show_if: [
              ['hostNetwork', '=', false],
            ],
            type: 'list',
          },
          variable: 'portForwardingList',
        },
        {
          description: 'Configure Liveness Probe',
          group: 'Health Check',
          label: 'Liveness Probe',
          schema: {
            attrs: [],
            default: null,
            hidden: true,
            type: 'dict',
          },
          variable: 'livenessProbe',
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
      ],
    },
  } as CatalogApp;

  const existingChartEdit = {
    name: 'app_name',
    id: 'app_name',
    config: {
      apiPort: 8927,
      maize: {
        apiPort: 8933,
        environmentVariables: [
          {
            name: 'name1',
            value: 'value2',
          },
          {
            name: 'name1',
            value: 'value2',
          },
        ],
        farmerPort: 8647,
        ports: [
          {
            containerPort: 8933,
            name: 'api',
            protocol: 'TCP',
          },
          {
            containerPort: 8644,
            name: 'blockchain',
            protocol: 'TCP',
          },
          {
            containerPort: 8647,
            name: 'farming',
            protocol: 'TCP',
          },
        ],
        volumeMounts: {
          config: {
            datasetName: 'maize-config',
            hostPath: '/mnt/my pool',
            hostPathEnabled: true,
            mountPath: '/root/.chia',
          },
          mnemonic: {
            datasetName: 'config',
            hostPathEnabled: false,
            mountPath: '/root/.chia/mnemonic.txt',
            readOnly: true,
            subPath: 'mnemonic.txt',
          },
        },
      },
      maizeEnabled: true,
      memLimit: '1234',
      release_name: 'app_name',
      timezone: 'America/Los_Angeles',
    } as { [key: string]: ChartFormValue },
    chart_schema: {
      schema: {
        groups: [
          {
            name: 'Machinaris Configuration',
            description: 'Machinaris Configuration description',
          },
        ],
        portals: {},
        questions: [
          {
            variable: 'timezone',
            label: 'Configure timezone',
            group: 'Machinaris Configuration',
            description: 'Configure timezone for machinaris',
            schema: {
              type: 'string',
              enum: [
                {
                  value: 'America/Los_Angeles',
                  description: "'America/Los_Angeles' timezone",
                },
                {
                  value: 'Europe/Paris',
                  description: "'Europe/Paris' timezone",
                },
              ],
              default: 'America/Los_Angeles',
            },
          },
        ],
      },
    },
  } as ChartRelease;

  const createComponent = createComponentFactory({
    component: ChartFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(IxSlideInService),
      mockWebsocket([
        mockCall('chart.release.create'),
        mockCall('chart.release.update'),
      ]),
      mockProvider(MatDialog, {
        open: jest.fn(() => mockDialogRef),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows values for an existing data when form is opened for create', () => {
    spectator.component.setChartCreate(existingChartCreate);
    const values = spectator.component.form.value;

    expect(values).toEqual({
      release_name: '',
      service: {
        apiPort: 9501,
        gatewayPort: 9880,
        swarmPort: 9401,
      },
      version: '1.2.1',
      updateStrategy: 'RollingUpdate',
      externalInterfaces: [],
      hostNetwork: false,
      portForwardingList: [],
    });
  });

  it('shows values of a dynamic fields when the form value changes.', () => {
    spectator.component.setChartCreate(existingChartCreate);

    spectator.component.form.patchValue({
      hostNetwork: true,
      updateStrategy: 'Recreate',
    });

    const values = spectator.component.form.value;

    expect(values).toEqual({
      release_name: '',
      service: {
        apiPort: 9501,
        gatewayPort: 9880,
        swarmPort: 9401,
      },
      version: '1.2.1',
      updateStrategy: 'Recreate',
      hostNetwork: true,
    });
  });

  it('creating when form is submitted', () => {
    spectator.component.setChartCreate(existingChartCreate);

    spectator.component.form.patchValue({
      release_name: 'app_name',
      service: {
        apiPort: 9599,
        gatewayPort: 9888,
        swarmPort: 9477,
      },
    });

    spectator.component.onSubmit();

    expect(spectator.component.dialogRef.componentInstance.setCall).toHaveBeenCalledWith(
      'chart.release.create', [{
        catalog: 'OFFICIAL',
        item: 'ipfs',
        release_name: 'app_name',
        train: 'charts',
        values: {
          release_name: 'app_name',
          service: {
            apiPort: 9599,
            gatewayPort: 9888,
            swarmPort: 9477,
          },
          updateStrategy: 'RollingUpdate',
          externalInterfaces: [],
          hostNetwork: false,
          portForwardingList: [],
        },
        version: '1.2.1',
      }],
    );
  });

  it('shows values for an existing data when form is opened for edit', () => {
    spectator.component.setChartEdit(existingChartEdit);
    const values = spectator.component.form.value;

    expect(values).toEqual({
      release_name: 'app_name',
      timezone: 'America/Los_Angeles',
    });
  });

  it('disables immutable fields when form is opened for edit', () => {
    const existingChartEditWithImmutable = { ...existingChartEdit };
    existingChartEditWithImmutable.chart_schema.schema.questions[0].schema.immutable = true;
    spectator.component.setChartEdit(existingChartEditWithImmutable);
    spectator.detectComponentChanges();

    expect(spectator.component.form.get('timezone').disabled).toBeTruthy();
  });

  it('editing when form is submitted', () => {
    spectator.component.setChartEdit(existingChartEdit);

    spectator.component.form.patchValue({
      timezone: 'Europe/Paris',
    });

    spectator.component.onSubmit();

    expect(spectator.component.dialogRef.componentInstance.setCall).toHaveBeenCalledWith(
      'chart.release.update', ['app_name', {
        values: {
          timezone: 'Europe/Paris',
        },
      }],
    );
  });
});
