import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  TnAutocompleteHarness, TnButtonHarness, TnCheckboxHarness, TnDialog, TnFormFieldHarness, TnInputHarness,
  TnSelectHarness,
} from '@truenas/ui-components';
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
import { ixFormMinSubmitFeedbackMs } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import {
  IxIpInputWithNetmaskComponent,
} from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import {
  IxIpInputWithNetmaskHarness,
} from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.harness';
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
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
    path: '/mnt/nfs/ds',
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
    getData: jest.fn((): undefined => undefined),
  };

  const getTnCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getTnSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const clickAdvancedOptions = async (): Promise<void> => {
    const button = await loader.getHarness(TnButtonHarness.with({ label: 'Advanced Options' }));
    await button.click();
  };
  const setDescription = async (value: string): Promise<void> => {
    const description = await loader.getHarness(TnInputHarness.with({ name: 'comment' }));
    await description.setValue(value);
  };

  // The four user/group autocompletes in Access-fieldset DOM order.
  const getAutocomplete = async (
    field: 'maproot_user' | 'maproot_group' | 'mapall_user' | 'mapall_group',
  ): Promise<TnAutocompleteHarness> => {
    const index = ['maproot_user', 'maproot_group', 'mapall_user', 'mapall_group'].indexOf(field);
    const autocompletes = await loader.getAllHarnesses(TnAutocompleteHarness);
    return autocompletes[index];
  };

  const typeCustomValue = async (harness: TnAutocompleteHarness, value: string): Promise<void> => {
    await harness.setInputValue(value);
    await harness.blur();
  };

  /**
   * The `<ix-form>` wrapper emits a dev-mode advisory when the form has nested FormArrays
   * (networks/hosts); the payload here is built from `form.value`, so it's benign. Swallow only
   * that specific message and forward anything else, so genuine warnings still surface.
   */
  const muteNestedFormArrayAdvisory = (): void => {
    const original = console.warn.bind(console) as (...args: unknown[]) => void;
    jest.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      const [first] = args;
      if (typeof first === 'string' && first.startsWith('[ix-form] changedValues')) {
        return;
      }
      original(...args);
    });
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
        getUserByName: (username: string) => of({ username } as { username: string }),
        getGroupByName: (groupName: string) => of({ group: groupName }),
        getUserByNameCached: (username: string) => of({ username } as { username: string }),
        getGroupByNameCached: (groupName: string) => of({ group: groupName }),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(true),
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
      muteNestedFormArrayAdvisory();
    });

    it('gives the Description input an accessible name matching its field label', async () => {
      const description = await loader.getHarness(TnInputHarness.with({ name: 'comment' }));
      expect(await description.getAriaLabel()).toBe('Description');
    });

    it('shows Access fields when Advanced Options button is pressed', async () => {
      await clickAdvancedOptions();

      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Maproot User' }))).toBe(true);
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Maproot Group' }))).toBe(true);
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Mapall User' }))).toBe(true);
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Mapall Group' }))).toBe(true);
      expect(await loader.getAllHarnesses(TnAutocompleteHarness)).toHaveLength(4);
      expect(await loader.hasHarness(TnCheckboxHarness.with({ label: 'Read Only' }))).toBe(true);
    });

    it('loads NFS config and shows Security select in Access fieldset when NFS is version 4', async () => {
      const websocketMock = spectator.inject(MockApiService);
      websocketMock.mockCallOnce('nfs.config', {
        protocols: [NfsProtocol.V4],
      } as NfsConfig);
      spectator.component.ngOnInit();

      await clickAdvancedOptions();

      const security = await getTnSelect('security');
      expect(security).toBeTruthy();
      // Accessible-name guard: the tn-form-field label is visual-only, so the combobox
      // relies on [ariaLabel] for its name.
      expect(spectator.query('tn-select [aria-label="Security"]')).toBeTruthy();
    });

    it('creates a new NFS share when form is submitted', async () => {
      mockStore$.overrideSelector(selectServices, [{ id: 1, service: ServiceName.Nfs, enable: false } as Service]);

      await clickAdvancedOptions();

      await form.fillForm({
        Path: '/mnt/new/ds',
      });
      await typeCustomValue(await getAutocomplete('maproot_user'), 'news');
      await typeCustomValue(await getAutocomplete('maproot_group'), 'sys');
      await setDescription('New share');
      await (await getTnCheckbox('ro')).check();

      const networkList = await loader.getHarness(IxListHarness.with({ label: 'Networks' }));
      await networkList.pressAddButton();
      const hostsList = await loader.getHarness(IxListHarness.with({ label: 'Hosts' }));
      await hostsList.pressAddButton();
      await form.fillForm({
        Network: '192.168.1.189/24',
      });
      const hostInput = await loader.getHarness(TnInputHarness.with({ ancestor: 'ix-list-item' }));
      await hostInput.setValue('truenas.com');

      expect(await loader.getHarnessOrNull(
        TnCheckboxHarness.with({ selector: '[formControlName="expose_snapshots"]' }),
      )).toBeNull();

      mockStore$.overrideSelector(selectIsEnterprise, true);
      mockStore$.refreshState();

      await (await getTnCheckbox('expose_snapshots')).check();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('sharing.nfs.create', [{
        path: '/mnt/new/ds',
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
        props: { nfsShareData: { existingNfsShare: existingShare } },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);
      mockStore$ = spectator.inject(MockStore);
      store$ = spectator.inject(Store);
      jest.spyOn(store$, 'dispatch');
      muteNestedFormArrayAdvisory();
    });

    it('shows values for an existing NFS share when it is open for edit', async () => {
      await clickAdvancedOptions();

      const description = await loader.getHarness(TnInputHarness.with({ name: 'comment' }));
      expect(await description.getValue()).toBe('My share');
      expect(await (await getTnCheckbox('enabled')).isChecked()).toBe(true);
      expect(await (await getTnCheckbox('ro')).isChecked()).toBe(false);

      const values = await form.getValues();
      expect(values).toMatchObject({
        Path: '/mnt/nfs/ds',
      });
      expect(await (await getAutocomplete('maproot_user')).getInputValue()).toBe('news');
      expect(await (await getAutocomplete('maproot_group')).getInputValue()).toBe('operator');

      const networks = await loader.getAllHarnesses(IxIpInputWithNetmaskHarness.with({ label: 'Network' }));
      const hosts = await loader.getAllHarnesses(TnInputHarness.with({ ancestor: 'ix-list-item' }));
      expect(networks).toHaveLength(1);
      expect(hosts).toHaveLength(2);
      expect(await networks[0].getValue()).toBe('192.168.1.78/21');
      expect(await hosts[0].getValue()).toBe('127.0.0.1');
      expect(await hosts[1].getValue()).toBe('192.168.1.23');
    });

    it('updates an existing NFS share when an edit form is submitted', async () => {
      mockStore$.overrideSelector(selectServices, [{ service: ServiceName.Nfs, enable: true } as Service]);

      await setDescription('Updated share');
      await (await getTnCheckbox('enabled')).uncheck();

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
          path: '/mnt/nfs/ds',
          ro: false,
          security: [],
        },
      ]);
      expect(store$.dispatch).toHaveBeenCalledWith(checkIfServiceIsEnabled({ serviceName: ServiceName.Nfs }));
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });

    it('checks if NFS service is not enabled and enables it after confirmation', async () => {
      mockStore$.overrideSelector(selectServices, [{ id: 1, service: ServiceName.Nfs, enable: false } as Service]);

      await setDescription('Updated share');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(store$.dispatch).toHaveBeenCalledWith(checkIfServiceIsEnabled({ serviceName: ServiceName.Nfs }));
    });
  });

  describe('side panel host (no SlideInRef)', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          { provide: SlideInRef, useValue: null },
          // Opt out of the panel-mode min-feedback hold so the close is synchronous.
          { provide: ixFormMinSubmitFeedbackMs, useValue: 0 },
        ],
        props: { nfsShareData: { existingNfsShare: existingShare } },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
      muteNestedFormArrayAdvisory();
    });

    it('resolves incoming data from the nfsShareData input and emits closed when saved', async () => {
      const closedSpy = jest.fn();
      spectator.component.closed.subscribe(closedSpy);

      await setDescription('Panel edit');
      expect(spectator.component.canSubmit()).toBe(true);
      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('sharing.nfs.update', [
        1,
        expect.objectContaining({ comment: 'Panel edit', path: '/mnt/nfs/ds' }),
      ]);
      expect(closedSpy).toHaveBeenCalledWith(true);
    });
  });
});
