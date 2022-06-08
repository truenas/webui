import { EventEmitter } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CatalogApp } from 'app/interfaces/catalog.interface';
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
          name: 'IPFS Configuration',
          description: 'Configure Storage for IPFS',
        },
      ],
      questions: [
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
    },
    chart_schema: {
      schema: {
        groups: [
          {
            name: 'Machinaris Configuration',
            description: 'Machinaris Configuration description',
          },
        ],
        questions: [
          {
            variable: 'timezone',
            label: 'Configure timezone',
            group: 'Machinaris Configuration',
            description: 'Configure timezone for machinaris',
            schema: {
              type: 'string',
              $ref: [
                'definitions/timezone',
              ],
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
  } as any;

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
