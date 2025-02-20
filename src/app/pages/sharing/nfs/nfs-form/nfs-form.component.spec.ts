import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NfsProtocol } from 'app/enums/nfs-protocol.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { NfsConfig } from 'app/interfaces/nfs-config.interface';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { Service } from 'app/interfaces/service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import {
  IxIpInputWithNetmaskComponent,
} from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import {
  IxIpInputWithNetmaskHarness,
} from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.harness';
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { FilesystemService } from 'app/services/filesystem.service';
import { UserService } from 'app/services/user.service';
import { AppState } from 'app/store';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { selectServices } from 'app/store/services/services.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

describe('NfsFormComponent', () => {
  const existingShare = {
    id: 1,
    comment: 'My share',
    enabled: true,
    hosts: ['127.0.0.1', '192.168.1.23'],
    locked: false,
    mapall_group: '',
    mapall_user: '',
    maproot_group: 'operator',
    maproot_user: 'news',
    networks: ['192.168.1.78/21'],
    path: '/mnt/nfs',
    quiet: false,
    ro: false,
  } as NfsShare;

  let spectator: Spectator<NfsFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let api: ApiService;
  let mockStore$: MockStore<AppState>;
  let store$: Store<AppState>;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  const createComponent = createComponentFactory({
    component: NfsFormComponent,
    imports: [
      ReactiveFormsModule,
      IxIpInputWithNetmaskComponent,
    ],
    providers: [
      mockApi([
        mockCall('sharing.nfs.create'),
        mockCall('sharing.nfs.update'),
        mockCall('nfs.config', {
          protocols: [NfsProtocol.V3],
        } as NfsConfig),
      ]),
      mockAuth(),
      mockProvider(SlideIn, {
        components$: of([]),
      }),
      mockProvider(FilesystemService),
      mockProvider(UserService, {
        userQueryDsCache: () => of([
          { username: 'news' },
          { username: 'root' },
        ]),
        groupQueryDsCache: () => of([
          { group: 'sys' },
          { group: 'operator' },
        ]),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(SlideInRef, slideInRef),
      provideMockStore({
        selectors: [
          {
            selector: selectServices,
            value: [],
          },
          {
            selector: selectIsEnterprise,
            value: false,
          },
        ],
      }),
    ],
  });

  describe('creates a new NFS share', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);
      mockStore$ = spectator.inject(MockStore);
      store$ = spectator.inject(Store);
      jest.spyOn(store$, 'dispatch');
    });

    it('shows Access fields when Advanced Options button is pressed', async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      const fields = Object.keys(await form.getControlHarnessesDict());
      expect(fields).toContain('Read Only');
      expect(fields).toContain('Maproot User');
      expect(fields).toContain('Maproot Group');
      expect(fields).toContain('Mapall User');
      expect(fields).toContain('Mapall Group');
    });

    it('loads NFS config and shows Security select in Access fieldset when NFS is version 4', async () => {
      const websocketMock = spectator.inject(MockApiService);
      websocketMock.mockCallOnce('nfs.config', {
        protocols: [NfsProtocol.V4],
      } as NfsConfig);
      spectator.component.ngOnInit();

      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      const security = await loader.getHarness(IxSelectHarness.with({ label: 'Security' }));
      expect(security).toExist();
    });

    it('creates a new NFS share when form is submitted', async () => {
      mockStore$.overrideSelector(selectServices, [{ id: 1, service: ServiceName.Nfs, enable: false } as Service]);

      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      await form.fillForm({
        Path: '/mnt/new',
        Description: 'New share',
        Enabled: true,
        'Read Only': true,
        'Maproot User': 'news',
        'Maproot Group': 'sys',
      });

      const networkList = await loader.getHarness(IxListHarness.with({ label: 'Networks' }));
      await networkList.pressAddButton();
      const hostsList = await loader.getHarness(IxListHarness.with({ label: 'Hosts' }));
      await hostsList.pressAddButton();
      await form.fillForm({
        Network: '192.168.1.189/24',
        'Authorized Hosts and IP addresses': 'truenas.com',
      });

      expect(await form.getControl('Expose Snapshots')).not.toBeTruthy();

      mockStore$.overrideSelector(selectIsEnterprise, true);
      mockStore$.refreshState();

      await form.fillForm({
        'Expose Snapshots': true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('sharing.nfs.create', [{
        path: '/mnt/new',
        comment: 'New share',
        enabled: true,
        ro: true,
        mapall_user: '',
        mapall_group: '',
        security: [],
        maproot_user: 'news',
        maproot_group: 'sys',
        networks: ['192.168.1.189/24'],
        hosts: ['truenas.com'],
        expose_snapshots: true,
      }]);
      expect(store$.dispatch).toHaveBeenCalledWith(checkIfServiceIsEnabled({ serviceName: ServiceName.Nfs }));
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('updates NFS share', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => ({ existingNfsShare: existingShare }) }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);
      mockStore$ = spectator.inject(MockStore);
      store$ = spectator.inject(Store);
      jest.spyOn(store$, 'dispatch');
    });

    it('shows values for an existing NFS share when it is open for edit', async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      const values = await form.getValues();
      const networks = await loader.getAllHarnesses(IxIpInputWithNetmaskHarness.with({ label: 'Network' }));
      const hosts = await loader.getAllHarnesses(IxInputHarness.with({ label: 'Authorized Hosts and IP addresses' }));
      expect(values).toMatchObject({
        Path: '/mnt/nfs',
        Description: 'My share',
        Enabled: true,
        'Read Only': false,
        'Mapall User': '',
        'Mapall Group': '',
        'Maproot Group': 'operator',
        'Maproot User': 'news',
      });
      expect(networks).toHaveLength(1);
      expect(hosts).toHaveLength(2);
      expect(await networks[0].getValue()).toBe('192.168.1.78/21');
      expect(await hosts[0].getValue()).toBe('127.0.0.1');
      expect(await hosts[1].getValue()).toBe('192.168.1.23');
    });

    it('updates an existing NFS share when an edit form is submitted', async () => {
      mockStore$.overrideSelector(selectServices, [{ service: ServiceName.Nfs, enable: true } as Service]);

      await form.fillForm({
        Description: 'Updated share',
        Enabled: false,
      });

      const networkList = await loader.getHarness(IxListHarness.with({ label: 'Networks' }));
      await networkList.pressAddButton();

      const networks = await loader.getAllHarnesses(IxIpInputWithNetmaskHarness.with({ label: 'Network' }));
      await networks[1].setValue('10.56.1.1/20');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('sharing.nfs.update', [
        1,
        {
          comment: 'Updated share',
          enabled: false,
          hosts: ['127.0.0.1', '192.168.1.23'],
          mapall_group: '',
          mapall_user: '',
          maproot_group: 'operator',
          maproot_user: 'news',
          networks: ['192.168.1.78/21', '10.56.1.1/20'],
          path: '/mnt/nfs',
          ro: false,
          security: [],
        },
      ]);
      expect(store$.dispatch).toHaveBeenCalledWith(checkIfServiceIsEnabled({ serviceName: ServiceName.Nfs }));
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });

    it('checks if NFS service is not enabled and enables it after confirmation', async () => {
      mockStore$.overrideSelector(selectServices, [{ id: 1, service: ServiceName.Nfs, enable: false } as Service]);

      await form.fillForm({
        Description: 'Updated share',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(store$.dispatch).toHaveBeenCalledWith(checkIfServiceIsEnabled({ serviceName: ServiceName.Nfs }));
    });
  });
});
