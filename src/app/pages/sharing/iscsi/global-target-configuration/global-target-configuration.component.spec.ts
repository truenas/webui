import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  TnDialog, TnCheckboxHarness, TnChipInputHarness, TnInputHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { RdmaProtocolName, ServiceName } from 'app/enums/service-name.enum';
import { IscsiGlobalConfig } from 'app/interfaces/iscsi-global-config.interface';
import { Service } from 'app/interfaces/service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { ApiService } from 'app/modules/websocket/api.service';
import { GlobalTargetConfigurationComponent } from 'app/pages/sharing/iscsi/global-target-configuration/global-target-configuration.component';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { selectServices } from 'app/store/services/services.selectors';
import { selectIsEnterprise, selectProductType } from 'app/store/system-info/system-info.selectors';

describe('TargetGlobalConfigurationComponent', () => {
  let spectator: Spectator<GlobalTargetConfigurationComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  let mockStore$: MockStore<AppState>;
  let store$: Store<AppState>;

  const getTnInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getTnChipInput = (name: string): Promise<TnChipInputHarness> => loader.getHarness(
    TnChipInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getTnCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const hasTnCheckbox = async (name: string): Promise<boolean> => (await loader.getAllHarnesses(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  )).length > 0;

  const createComponent = createComponentFactory({
    component: GlobalTargetConfigurationComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('rdma.capable_protocols', [RdmaProtocolName.Iser]),
        mockCall('iscsi.global.config', {
          basename: 'iqn.2005-10.org.freenas.ctl',
          isns_servers: ['188.23.4.23', '92.233.1.1'],
          pool_avail_threshold: 20,
          listen_port: 3260,
        } as IscsiGlobalConfig),
        mockCall('iscsi.global.update'),
      ]),
      mockProvider(TnDialog),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      ...ixFormTestingProviders(),
      provideMockStore({
        selectors: [
          {
            selector: selectIsHaLicensed,
            value: true,
          },
          {
            selector: selectServices,
            value: [],
          },
          {
            selector: selectProductType,
            value: null,
          },
          {
            selector: selectIsEnterprise,
            value: false,
          },
        ],
      }),
    ],
  });

  /**
   * The basename control, whose validator messages have no rendered surface to assert against.
   * The cast is deliberate: `form` is protected because only the component and its `<ix-form>`
   * drive it.
   */
  const getBasenameControl = (): AbstractControl => (
    spectator.component as unknown as { form: FormGroup }
  ).form.controls.basename;

  /** Re-creates the component in the same TestBed, so a changed selector/mock is picked up. */
  function recreateComponent(): void {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    mockStore$ = spectator.inject(MockStore);
    store$ = spectator.inject(Store);
    jest.spyOn(store$, 'dispatch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads iSCSI global config when component is initialized', () => {
    expect(api.call).toHaveBeenCalledWith('iscsi.global.config');
  });

  it('shows current values for iSCSI global settings', async () => {
    expect(await (await getTnInput('basename')).getValue()).toBe('iqn.2005-10.org.freenas.ctl');
    expect(await (await getTnChipInput('isns_servers')).getChips()).toEqual(['188.23.4.23', '92.233.1.1']);
    expect(await (await getTnInput('pool_avail_threshold')).getValue()).toBe('20');
    expect(await (await getTnInput('listen_port')).getValue()).toBe('3260');
    expect(await (await getTnCheckbox('alua')).isChecked()).toBe(false);
    expect(await (await getTnCheckbox('iser')).isChecked()).toBe(false);
  });

  it('saves form values and closes when the host submits the form', async () => {
    const closed = jest.fn();
    spectator.component.closed.subscribe(closed);

    await (await getTnInput('basename')).setValue('iqn.new.org.freenas.ctl');

    const isnsServers = await getTnChipInput('isns_servers');
    await isnsServers.removeChip('188.23.4.23');
    await isnsServers.removeChip('92.233.1.1');
    await isnsServers.addChip('32.12.112.42');
    await isnsServers.addChip('8.2.1.2');

    await (await getTnInput('pool_avail_threshold')).setValue('15');
    await (await getTnInput('listen_port')).setValue('3270');
    await (await getTnCheckbox('alua')).uncheck();

    spectator.component.submit();

    expect(api.call).toHaveBeenCalledWith('iscsi.global.update', [{
      basename: 'iqn.new.org.freenas.ctl',
      isns_servers: ['32.12.112.42', '8.2.1.2'],
      pool_avail_threshold: 15,
      listen_port: 3270,
      alua: false,
    }]);
    expect(closed).toHaveBeenCalledWith(true);
  });

  it('checks if iSCSI service is enabled and does nothing if it is', () => {
    mockStore$.overrideSelector(selectServices, [{
      id: 13,
      service: ServiceName.Iscsi,
      enable: true,
    } as Service]);
    mockStore$.refreshState();

    spectator.component.submit();

    expect(store$.dispatch).toHaveBeenCalledWith(checkIfServiceIsEnabled({ serviceName: ServiceName.Iscsi }));
  });

  it('if iSCSI service is not running, asks user if service needs to be enabled', () => {
    mockStore$.overrideSelector(selectServices, [{
      id: 13,
      service: ServiceName.Iscsi,
      enable: false,
    } as Service]);
    mockStore$.refreshState();

    spectator.component.submit();

    expect(store$.dispatch).toHaveBeenCalledWith(checkIfServiceIsEnabled({ serviceName: ServiceName.Iscsi }));
  });

  it('disables iSER field unless it is an enterprise system with RDMA capable NIC', async () => {
    expect(await (await getTnCheckbox('iser')).isDisabled()).toBe(true);

    // A fresh instance rather than a second `ngOnInit()` on the one from `beforeEach`:
    // re-initialising an already-initialised form re-registers its valueChanges subscriptions.
    mockStore$.overrideSelector(selectIsEnterprise, true);
    mockStore$.refreshState();
    recreateComponent();

    expect(await (await getTnCheckbox('iser')).isDisabled()).toBe(false);
  });

  it('keeps the loaded ALUA value across a change in HA license status', async () => {
    jest.spyOn(api, 'call').mockImplementation((method: string) => {
      if (method === 'iscsi.global.config') {
        return of({
          basename: 'iqn.2005-10.org.freenas.ctl',
          isns_servers: [],
          pool_avail_threshold: 20,
          listen_port: 3260,
          alua: true,
        } as IscsiGlobalConfig);
      }
      if (method === 'rdma.capable_protocols') {
        return of([]);
      }
      return of(null);
    });

    recreateComponent();
    expect(await (await getTnCheckbox('alua')).isChecked()).toBe(true);

    // The control is dropped entirely on a non-HA system, so ALUA never reaches the payload.
    mockStore$.overrideSelector(selectIsHaLicensed, false);
    mockStore$.refreshState();
    spectator.detectChanges();
    expect(await hasTnCheckbox('alua')).toBe(false);

    // Re-added from the loaded config rather than reset to the control's default.
    mockStore$.overrideSelector(selectIsHaLicensed, true);
    mockStore$.refreshState();
    spectator.detectChanges();
    expect(await (await getTnCheckbox('alua')).isChecked()).toBe(true);
  });

  it('validates Base Name field only when it is being modified', async () => {
    const basename = await getTnInput('basename');

    // Original value is 'iqn.2005-10.org.freenas.ctl' from the mock, so the form is submittable
    // without the basename being touched at all.
    expect(spectator.component.canSubmit()).toBe(true);

    // Uppercase letters - validation should trigger
    await basename.setValue('IQN.2005-10.ORG.FREENAS.CTL');
    expect(spectator.component.canSubmit()).toBe(false);
    // The message is only reachable off the control: it never reaches the DOM until the field is
    // blurred, and this asserts the translated copy the user eventually sees.
    expect(getBasenameControl().errors).toMatchObject({
      pattern: { message: 'Only lowercase alphanumeric characters and . : - are allowed.' },
    });

    // Special characters like @ and !
    await basename.setValue('iqn.2005-10.org.freenas.ctl@%!!');
    expect(spectator.component.canSubmit()).toBe(false);

    // Spaces
    await basename.setValue('iqn 2005-10 org freenas ctl');
    expect(spectator.component.canSubmit()).toBe(false);

    // Valid value (lowercase, dots, dashes, colons)
    await basename.setValue('iqn.2005-10.org.freenas.ctl:target');
    expect(spectator.component.canSubmit()).toBe(true);

    // Back to the original value - valid again
    await basename.setValue('iqn.2005-10.org.freenas.ctl');
    expect(spectator.component.canSubmit()).toBe(true);
  });

  it('allows saving form when only modifying non-basename fields, even with non-conforming basename', async () => {
    // Setup a mock with a non-conforming basename (uppercase)
    jest.spyOn(api, 'call').mockImplementation((method: string) => {
      if (method === 'iscsi.global.config') {
        return of({
          basename: 'IQN.2005-10.ORG.FREENAS.CTL', // Non-conforming
          isns_servers: ['188.23.4.23'],
          pool_avail_threshold: 20,
          listen_port: 3260,
        } as IscsiGlobalConfig);
      }
      if (method === 'iscsi.global.update') {
        return of(null);
      }
      return of(null);
    });

    recreateComponent();

    // Don't touch basename, only modify listen_port
    await (await getTnInput('listen_port')).setValue('3270');

    // Save is available because we didn't modify the basename.
    expect(spectator.component.canSubmit()).toBe(true);

    spectator.component.submit();

    // Should successfully call the API
    expect(api.call).toHaveBeenCalledWith('iscsi.global.update', [
      expect.objectContaining({
        listen_port: 3270,
      }),
    ]);
  });
});
