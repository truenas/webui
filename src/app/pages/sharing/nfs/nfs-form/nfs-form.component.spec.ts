import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  TnAutocompleteHarness, TnButtonHarness, TnCheckboxHarness, TnDialog, TnFormFieldHarness, TnInputHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ServiceName } from 'app/enums/service-name.enum';
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

  const clickButton = async (label: string): Promise<void> => {
    const button = await loader.getHarness(TnButtonHarness.with({ label }));
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
      ]),
      mockAuth(),
      mockProvider(SlideIn),
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
    });

    it('gives the Description input an accessible name matching its field label', async () => {
      const description = await loader.getHarness(TnInputHarness.with({ name: 'comment' }));
      expect(await description.getAriaLabel()).toBe('Description');
    });

    it('shows Access fields when Advanced Options button is pressed', async () => {
      await clickButton('Advanced Options');

      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Maproot User' }))).toBe(true);
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Maproot Group' }))).toBe(true);
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Mapall User' }))).toBe(true);
      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Mapall Group' }))).toBe(true);
      expect(await loader.getAllHarnesses(TnAutocompleteHarness)).toHaveLength(4);
      expect(await loader.hasHarness(TnCheckboxHarness.with({ label: 'Read Only' }))).toBe(true);
    });

    it('shows a Security select with an accessible name in the Access fieldset', async () => {
      await clickButton('Advanced Options');

      expect(await loader.hasHarness(TnFormFieldHarness.with({ label: 'Security' }))).toBe(true);
      // Accessible-name guard: the tn-form-field label is visual-only, so the combobox
      // relies on [ariaLabel] for its name.
      expect(spectator.query('tn-select [aria-label="Security"]')).toBeTruthy();
    });

    it('creates a new NFS share when form is submitted', async () => {
      mockStore$.overrideSelector(selectServices, [{ id: 1, service: ServiceName.Nfs, enable: false } as Service]);

      await clickButton('Advanced Options');

      await form.fillForm({
        Path: '/mnt/new/ds',
      });
      await typeCustomValue(await getAutocomplete('maproot_user'), 'news');
      await typeCustomValue(await getAutocomplete('maproot_group'), 'sys');
      await setDescription('New share');
      const readOnly = await loader.getHarness(TnCheckboxHarness.with({ label: 'Read Only' }));
      await readOnly.check();
      const enabled = await loader.getHarness(TnCheckboxHarness.with({ label: 'Enabled' }));
      expect(await enabled.isChecked()).toBe(true);

      const networkList = await loader.getHarness(IxListHarness.with({ label: 'Networks' }));
      await networkList.pressAddButton();
      const hostsList = await loader.getHarness(IxListHarness.with({ label: 'Hosts' }));
      await hostsList.pressAddButton();
      await form.fillForm({
        Network: '192.168.1.189/24',
        'Authorized Hosts and IP addresses': 'truenas.com',
      });

      // Not rendered for non-enterprise systems.
      expect(await loader.hasHarness(TnCheckboxHarness.with({ label: 'Expose Snapshots' }))).toBe(false);

      mockStore$.overrideSelector(selectIsEnterprise, true);
      mockStore$.refreshState();
      spectator.detectChanges();
      const exposeSnapshots = await loader.getHarness(TnCheckboxHarness.with({ label: 'Expose Snapshots' }));
      await exposeSnapshots.check();

      await clickButton('Save');

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
      await clickButton('Advanced Options');

      const description = await loader.getHarness(TnInputHarness.with({ name: 'comment' }));
      expect(await description.getValue()).toBe('My share');
      const enabled = await loader.getHarness(TnCheckboxHarness.with({ label: 'Enabled' }));
      expect(await enabled.isChecked()).toBe(true);
      const readOnly = await loader.getHarness(TnCheckboxHarness.with({ label: 'Read Only' }));
      expect(await readOnly.isChecked()).toBe(false);

      const values = await form.getValues();
      expect(values).toMatchObject({
        Path: '/mnt/nfs/ds',
      });
      expect(await (await getAutocomplete('maproot_user')).getInputValue()).toBe('news');
      expect(await (await getAutocomplete('maproot_group')).getInputValue()).toBe('operator');

      const networks = await loader.getAllHarnesses(IxIpInputWithNetmaskHarness.with({ label: 'Network' }));
      const hosts = await loader.getAllHarnesses(IxInputHarness.with({ label: 'Authorized Hosts and IP addresses' }));
      expect(networks).toHaveLength(1);
      expect(hosts).toHaveLength(2);
      expect(await networks[0].getValue()).toBe('192.168.1.78/21');
      expect(await hosts[0].getValue()).toBe('127.0.0.1');
      expect(await hosts[1].getValue()).toBe('192.168.1.23');
    });

    it('updates an existing NFS share when an edit form is submitted', async () => {
      mockStore$.overrideSelector(selectServices, [{ service: ServiceName.Nfs, enable: true } as Service]);

      await setDescription('Updated share');
      const enabled = await loader.getHarness(TnCheckboxHarness.with({ label: 'Enabled' }));
      await enabled.uncheck();

      const networkList = await loader.getHarness(IxListHarness.with({ label: 'Networks' }));
      await networkList.pressAddButton();

      const networks = await loader.getAllHarnesses(IxIpInputWithNetmaskHarness.with({ label: 'Network' }));
      await networks[1].setValue('10.56.1.1/20');

      await clickButton('Save');

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

      await clickButton('Save');

      expect(store$.dispatch).toHaveBeenCalledWith(checkIfServiceIsEnabled({ serviceName: ServiceName.Nfs }));
    });
  });

  describe('side panel host (no SlideInRef)', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          { provide: SlideInRef, useValue: null },
        ],
        props: {
          data: { existingNfsShare: existingShare },
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('does not render the modal header or the in-form Save button', async () => {
      expect(spectator.query('ix-modal-header')).toBeNull();
      expect(await loader.hasHarness(TnButtonHarness.with({ label: 'Save' }))).toBe(false);
    });

    it('resolves incoming data from the data input and emits closed when saved', async () => {
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
      expect(slideInRef.close).not.toHaveBeenCalled();
    });
  });
});
