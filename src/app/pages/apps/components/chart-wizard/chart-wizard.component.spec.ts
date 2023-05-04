import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { ChartSchemaNodeConf } from 'app/interfaces/chart-release.interface';
import { IxDynamicFormModule } from 'app/modules/ix-dynamic-form/ix-dynamic-form.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { ChartWizardComponent } from 'app/pages/apps/components/chart-wizard/chart-wizard.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppLoaderService, DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('ChartWizardComponent', () => {
  let spectator: Spectator<ChartWizardComponent>;
  let loader: HarnessLoader;

  const existingCatalogApp = {
    name: 'ipfs',
    versions: {
      ['1.2.1' as string]: {
        healthy: true,
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
      },
    },
    latest_version: '1.2.1',
  } as CatalogApp;

  const createComponent = createComponentFactory({
    component: ChartWizardComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      IxDynamicFormModule,
    ],
    providers: [
      mockProvider(IxSlideInService),
      mockProvider(DialogService),
      mockProvider(ApplicationsService, {
        getCatalogItem: jest.fn(() => of(existingCatalogApp)),
      }),
      mockProvider(AppLoaderService),
      mockWebsocket([
        mockCall('chart.release.create'),
        mockCall('chart.release.update'),
        mockCall('catalog.get_item_details', existingCatalogApp),
      ]),
      mockProvider(MatDialog, {
        open: jest.fn(() => mockEntityJobComponentRef),
      }),
      {
        provide: ActivatedRoute,
        useValue: {
          params: of({ appId: 'ipfs', catalog: 'OFFICIAL', train: 'charts' }),
          routeConfig: { path: 'install' },
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    spectator.inject(ApplicationsService);
    spectator.component.ngOnInit();
  });

  it('shows values for app when form is opened for create', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      'Application Name': 'ipfs',
      Version: '1.2.1',
      'API Port to use for IPFS (local)': '9501',
      'Gateway Port to use for IPFS (local)': '9880',
      'Provide access to node network namespace for the workload': false,
      'Swarm Port to use for IPFS (Public)': '9401',
      'Update Strategy': 'Create new pods and then kill old ones',
    });
  });

  it('creating when form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Application Name': 'appname',
      'API Port to use for IPFS (local)': '9599',
      'Gateway Port to use for IPFS (local)': '9822',
      'Provide access to node network namespace for the workload': true,
      'Update Strategy': 'Kill existing pods before creating new ones',
    });

    const values = await form.getValues();

    expect(values).toEqual({
      'Application Name': 'appname',
      Version: '1.2.1',
      'API Port to use for IPFS (local)': '9599',
      'Gateway Port to use for IPFS (local)': '9822',
      'Provide access to node network namespace for the workload': true,
      'Swarm Port to use for IPFS (Public)': '9401',
      'Update Strategy': 'Kill existing pods before creating new ones',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Install' }));
    await saveButton.click();

    expect(mockEntityJobComponentRef.componentInstance.setCall).toHaveBeenCalledWith(
      'chart.release.create', [{
        catalog: 'OFFICIAL',
        item: 'ipfs',
        release_name: 'appname',
        train: 'charts',
        values: {
          release_name: 'appname',
          service: {
            apiPort: 9599,
            gatewayPort: 9822,
            swarmPort: 9401,
          },
          updateStrategy: 'Recreate',
          hostNetwork: true,
        },
        version: '1.2.1',
      }],
    );
    expect(mockEntityJobComponentRef.componentInstance.submit).toHaveBeenCalled();
  });
});
