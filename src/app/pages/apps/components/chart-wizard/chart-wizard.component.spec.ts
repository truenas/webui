import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { mockProvider, createComponentFactory } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { ChartFormValue, ChartRelease, ChartSchemaNodeConf } from 'app/interfaces/chart-release.interface';
import { IxDynamicFormModule } from 'app/modules/ix-dynamic-form/ix-dynamic-form.module';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { ChartWizardComponent } from 'app/pages/apps/components/chart-wizard/chart-wizard.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';
import { DialogService } from 'app/services/dialog.service';
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

  const existingChartEdit = {
    name: 'app-name',
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
        getChartRelease: jest.fn(() => of([existingChartEdit])),
        getAllChartReleases: jest.fn(() => of([existingChartEdit])),
      }),
      mockWebsocket([
        mockJob('chart.release.create'),
        mockJob('chart.release.update'),
        mockCall('catalog.get_item_details', existingCatalogApp),
        mockCall('chart.release.query', [existingChartEdit]),
      ]),
      mockProvider(KubernetesStore, {
        selectedPool$: of('pool set'),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => mockEntityJobComponentRef),
      }),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  describe('Edit chart', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: ActivatedRoute,
            useValue: {
              parent: {
                params: of({ appId: 'app_name', catalog: 'TRUENAS', train: 'charts' }),
              },
              routeConfig: { path: 'edit' },
            },
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      spectator.inject(ApplicationsService);
    });

    it('navigates to app detail page if pool is not set', () => {
      const router = spectator.inject(Router);
      jest.spyOn(router, 'navigate').mockImplementation();

      const store = spectator.inject(KubernetesStore);
      Object.defineProperty(store, 'selectedPool$', { value: of(undefined) });
      spectator.component.ngOnInit();

      expect(router.navigate).toHaveBeenCalledWith(['/apps/available', 'TRUENAS', 'charts', 'app_name']);
    });

    it('shows values for an existing data when form is opened for edit', () => {
      const values = spectator.component.form.value;

      expect(values).toEqual({
        timezone: 'America/Los_Angeles',
      });
    });

    it('editing when form is submitted', () => {
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
      expect(mockEntityJobComponentRef.componentInstance.submit).toHaveBeenCalled();
    });
  });

  describe('Create chart', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: ActivatedRoute,
            useValue: {
              parent: {
                params: of({ appId: 'ipfs', catalog: 'TRUENAS', train: 'charts' }),
              },
              routeConfig: { path: 'install' },
            },
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      spectator.inject(ApplicationsService);
    });

    it('navigates to app detail page if pool is not set', () => {
      const router = spectator.inject(Router);
      jest.spyOn(router, 'navigate').mockImplementation();

      const store = spectator.inject(KubernetesStore);
      Object.defineProperty(store, 'selectedPool$', { value: of(undefined) });
      spectator.component.ngOnInit();

      expect(router.navigate).toHaveBeenCalledWith(['/apps/available', 'TRUENAS', 'charts', 'ipfs']);
    });

    it('checks validation error when app name already in use', async () => {
      const applicationName = await loader.getHarness(IxInputHarness.with({ label: 'Application Name' }));

      await applicationName.setValue('app-name');
      expect(await applicationName.getErrorText()).toBe('The name "app-name" is already in use.');
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
        'Swarm Port to use for IPFS (Public)': '9401',
        'Update Strategy': 'Kill existing pods before creating new ones',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Install' }));
      await saveButton.click();

      expect(mockEntityJobComponentRef.componentInstance.setCall).toHaveBeenCalledWith(
        'chart.release.create', [{
          catalog: 'TRUENAS',
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
          },
          version: '1.2.1',
        }],
      );
      expect(mockEntityJobComponentRef.componentInstance.submit).toHaveBeenCalled();
    });
  });
});
