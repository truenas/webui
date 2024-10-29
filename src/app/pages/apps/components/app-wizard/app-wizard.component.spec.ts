import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { mockProvider, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ChartFormValue, App, ChartSchemaNodeConf } from 'app/interfaces/app.interface';
import { CatalogApp, CatalogAppVersion } from 'app/interfaces/catalog.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { AppWizardComponent } from 'app/pages/apps/components/app-wizard/app-wizard.component';
import { DockerHubRateInfoDialogComponent } from 'app/pages/apps/components/dockerhub-rate-limit-info-dialog/dockerhub-rate-limit-info-dialog.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

const appVersion121 = {
  healthy: true,
  schema: {
    groups: [
      { name: 'Networking' },
      { name: 'Port Forwarding' },
      { name: 'Health Check' },
      { name: 'Workload Details' },
      { name: 'Scaling/Upgrade Policy' },
      { name: 'Restart Policy' },
      { name: 'IPFS Configuration' },
    ],
    questions: [
      {
        group: 'Scaling/Upgrade Policy',
        label: 'Update Strategy',
        schema: {
          default: 'RollingUpdate',
          enum: [
            {
              value: 'RollingUpdate',
              description: 'Create new containers and then kill old ones',
            },
            {
              value: 'Recreate',
              description: 'Kill existing containers before creating new ones',
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
          show_if: [
            ['workloadType', '!=', 'Deployment'],
          ],
          type: 'string',
        },
        variable: 'jobRestartPolicy',
      },
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
          default: false,
          hidden: true,
          type: 'boolean',
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
                default: 9401,
                required: true,
              },
            },
            {
              variable: 'apiPort',
              label: 'API Port to use for IPFS (local)',
              schema: {
                type: 'int',
                default: 9501,
                required: true,
              },
            },
            {
              variable: 'gatewayPort',
              label: 'Gateway Port to use for IPFS (local)',
              schema: {
                type: 'int',
                default: 9880,
                required: true,
              },
            },
          ],
        },
      },
    ],
  },
} as CatalogAppVersion;

const appVersion120 = {
  healthy: true,
  schema: {
    groups: [
      {
        description: 'Configure networking for container',
        name: 'Networking',
      },
    ],
    questions: [
      {
        group: 'Networking',
        label: 'Provide access to node network namespace for the workload Another Version',
        schema: {
          default: true,
          type: 'boolean',
        },
        variable: 'hostNetworkDifferentVersion',
      },
      {
        group: 'Networking',
        label: 'Provide access hidden',
        schema: {
          default: true,
          type: 'boolean',
          hidden: true,
        },
        variable: 'hostNetworkDifferentVersionHidden',
      },
    ],
  },
} as CatalogAppVersion;

describe('AppWizardComponent', () => {
  let spectator: Spectator<AppWizardComponent>;
  let loader: HarnessLoader;

  const existingCatalogApp = {
    name: 'ipfs',
    versions: {
      ['1.2.1' as string]: appVersion121,
      ['1.2.0' as string]: appVersion120,
    },
    latest_version: '1.2.1',
  } as CatalogApp;

  const existingAppEdit = {
    name: 'app-name',
    id: 'app_name',
    config: {
      maizeEnabled: true,
      release_name: 'app_name',
      timezone: 'America/Los_Angeles',
    } as Record<string, ChartFormValue>,
    metadata: {},
    version_details: {
      schema: {
        groups: [
          { name: 'Machinaris Configuration' },
        ],
        questions: [
          {
            variable: 'timezone',
            group: 'Machinaris Configuration',
            schema: {
              type: 'string',
              enum: [{ value: 'America/Los_Angeles', description: "'America/Los_Angeles' timezone" }],
              default: 'America/Los_Angeles',
            },
          },
        ],
      },
    },
  } as App;

  const createComponent = createComponentFactory({
    component: AppWizardComponent,
    imports: [
      ReactiveFormsModule,
      MockComponent(DockerHubRateInfoDialogComponent),
      MockComponent(PageHeaderComponent),
    ],
    componentProviders: [
      mockProvider(MatDialog),
    ],
    providers: [
      mockProvider(SlideInService),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of({}),
        })),
      }),
      mockProvider(ApplicationsService, {
        getCatalogAppDetails: jest.fn(() => of(existingCatalogApp)),
        getApp: jest.fn(() => of([existingAppEdit])),
        getAllApps: jest.fn(() => of([existingAppEdit])),
      }),
      mockWebSocket([
        mockJob('app.create'),
        mockJob('app.update'),
        mockCall('catalog.get_app_details', existingCatalogApp),
        mockCall('app.query', [existingAppEdit]),
        mockCall('app.image.dockerhub_rate_limit', {
          total_pull_limit: 13,
          total_time_limit_in_secs: 21600,
          remaining_pull_limit: 3,
          remaining_time_limit_in_secs: 21600,
          error: null,
        }),
      ]),
      mockProvider(DockerStore, {
        selectedPool$: of('pool set'),
      }),
      mockProvider(SlideInRef),
      mockProvider(Router),
      mockAuth(),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  describe('Edit app', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: ActivatedRoute,
            useValue: {
              parent: {
                params: of({ appId: 'app_name', catalog: 'TRUENAS', train: 'stable' }),
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

      const store = spectator.inject(DockerStore);
      Object.defineProperty(store, 'selectedPool$', { value: of(undefined) });
      spectator.component.ngOnInit();

      expect(router.navigate).toHaveBeenCalledWith(['/apps/available', 'stable', 'app_name']);
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

      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith(
        'app.update',
        ['app_name', {
          values: {
            timezone: 'Europe/Paris',
          },
        }],
      );
    });
  });

  describe('Create app', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: ActivatedRoute,
            useValue: {
              parent: {
                params: of({ appId: 'ipfs', catalog: 'TRUENAS', train: 'stable' }),
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

      const store = spectator.inject(DockerStore);
      Object.defineProperty(store, 'selectedPool$', { value: of(undefined) });
      spectator.component.ngOnInit();

      expect(router.navigate).toHaveBeenCalledWith(['/apps/available', 'stable', 'ipfs']);
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
        'Update Strategy': 'Create new containers and then kill old ones',
      });
    });

    it('creating when form is submitted', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Application Name': 'appname',
        'API Port to use for IPFS (local)': '9599',
        'Gateway Port to use for IPFS (local)': '9822',
        'Provide access to node network namespace for the workload': true,
        'Update Strategy': 'Kill existing containers before creating new ones',
      });

      const values = await form.getValues();

      expect(values).toEqual({
        'Application Name': 'appname',
        Version: '1.2.1',
        'API Port to use for IPFS (local)': '9599',
        'Gateway Port to use for IPFS (local)': '9822',
        'Swarm Port to use for IPFS (Public)': '9401',
        'Update Strategy': 'Kill existing containers before creating new ones',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Install' }));
      await saveButton.click();

      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith(
        'app.create',
        [{
          app_name: 'appname',
          catalog_app: 'ipfs',
          train: 'stable',
          values: {
            livenessProbe: false,
            release_name: 'appname',
            service: {
              apiPort: 9599,
              gatewayPort: 9822,
              swarmPort: 9401,
            },
            updateStrategy: 'Recreate',
            workloadType: 'Deployment',
          },
          version: '1.2.1',
        }],
      );
    });

    it('updates form when app version is changed and schema is updated', async () => {
      const form = await loader.getHarness(IxFormHarness);

      await form.fillForm({
        Version: '1.2.0',
      });

      const values = await form.getValues();
      expect(spectator.component.chartSchema.groups).toEqual(appVersion120.schema.groups);

      expect(values).toEqual({
        'Application Name': 'ipfs',
        Version: '1.2.0',
        'Provide access to node network namespace for the workload Another Version': true,
      });
    });

    it('submits form with hidden: true values as well since they should be a part of a request', async () => {
      const form = await loader.getHarness(IxFormHarness);

      await form.fillForm({
        Version: '1.2.0',
      });

      spectator.component.onSubmit();

      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith(
        'app.create',
        [{
          app_name: 'ipfs',
          catalog_app: 'ipfs',
          train: 'stable',
          values: {
            hostNetworkDifferentVersion: true,
            hostNetworkDifferentVersionHidden: true,
            release_name: 'ipfs',
          },
          version: '1.2.0',
        }],
      );
    });

    it('shows Docker Hub Rate Limit Info Dialog when remaining_pull_limit is less then 5', () => {
      expect(spectator.inject(MatDialog, true).open).toHaveBeenCalledWith(DockerHubRateInfoDialogComponent, {
        data: {
          total_pull_limit: 13,
          total_time_limit_in_secs: 21600,
          remaining_pull_limit: 3,
          remaining_time_limit_in_secs: 21600,
          error: null,
        },
      });
    });
  });
});
