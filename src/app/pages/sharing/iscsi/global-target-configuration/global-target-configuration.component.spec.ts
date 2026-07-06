import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  TnDialog, TnButtonHarness, TnCheckboxHarness, TnChipInputHarness, TnInputHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { RdmaProtocolName, ServiceName } from 'app/enums/service-name.enum';
import { IscsiGlobalConfig } from 'app/interfaces/iscsi-global-config.interface';
import { Service } from 'app/interfaces/service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const getTnInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getTnChipInput = (name: string): Promise<TnChipInputHarness> => loader.getHarness(
    TnChipInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getTnCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );

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
      mockProvider(SnackbarService),
      mockProvider(SlideInRef, slideInRef),
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

  it('saves form values when Save is pressed', async () => {
    await (await getTnInput('basename')).setValue('iqn.new.org.freenas.ctl');

    const isnsServers = await getTnChipInput('isns_servers');
    await isnsServers.removeChip('188.23.4.23');
    await isnsServers.removeChip('92.233.1.1');
    await isnsServers.addChip('32.12.112.42');
    await isnsServers.addChip('8.2.1.2');

    await (await getTnInput('pool_avail_threshold')).setValue('15');
    await (await getTnInput('listen_port')).setValue('3270');
    await (await getTnCheckbox('alua')).uncheck();

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('iscsi.global.update', [{
      basename: 'iqn.new.org.freenas.ctl',
      isns_servers: ['32.12.112.42', '8.2.1.2'],
      pool_avail_threshold: 15,
      listen_port: 3270,
      alua: false,
    }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  });

  it('checks if iSCSI service is enabled and does nothing if it is', async () => {
    mockStore$.overrideSelector(selectServices, [{
      id: 13,
      service: ServiceName.Iscsi,
      enable: true,
    } as Service]);
    mockStore$.refreshState();

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(store$.dispatch).toHaveBeenCalledWith(checkIfServiceIsEnabled({ serviceName: ServiceName.Iscsi }));
  });

  it('if iSCSI service is not running, asks user if service needs to be enabled', async () => {
    mockStore$.overrideSelector(selectServices, [{
      id: 13,
      service: ServiceName.Iscsi,
      enable: false,
    } as Service]);
    mockStore$.refreshState();

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(store$.dispatch).toHaveBeenCalledWith(checkIfServiceIsEnabled({ serviceName: ServiceName.Iscsi }));
  });

  it('disables iSER field unless it is an enterprise system with RDMA capable NIC', async () => {
    expect(await (await getTnCheckbox('iser')).isDisabled()).toBe(true);

    mockStore$.overrideSelector(selectIsEnterprise, true);
    spectator.component.ngOnInit();

    expect(await (await getTnCheckbox('iser')).isDisabled()).toBe(false);
  });

  it('validates Base Name field only when it is being modified', async () => {
    const basename = await getTnInput('basename');

    // Original value is 'iqn.2005-10.org.freenas.ctl' from mock
    // Form should be valid initially even if we don't touch the basename
    expect(spectator.component.form.controls.basename.valid).toBe(true);

    // Test with uppercase letters - validation should trigger
    await basename.setValue('IQN.2005-10.ORG.FREENAS.CTL');
    expect(spectator.component.form.controls.basename.invalid).toBe(true);
    expect(spectator.component.form.controls.basename.errors).toMatchObject({
      pattern: { message: 'Only lowercase alphanumeric characters and . : - are allowed.' },
    });

    // Test with special characters like @ and !
    await basename.setValue('iqn.2005-10.org.freenas.ctl@%!!');
    expect(spectator.component.form.controls.basename.invalid).toBe(true);

    // Test with spaces
    await basename.setValue('iqn 2005-10 org freenas ctl');
    expect(spectator.component.form.controls.basename.invalid).toBe(true);

    // Test with valid value (lowercase, dots, dashes, colons)
    await basename.setValue('iqn.2005-10.org.freenas.ctl:target');
    expect(spectator.component.form.controls.basename.valid).toBe(true);

    // Change back to original value - should be valid again
    await basename.setValue('iqn.2005-10.org.freenas.ctl');
    expect(spectator.component.form.controls.basename.valid).toBe(true);
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

    spectator.component.ngOnInit();
    spectator.detectChanges();

    // Don't touch basename, only modify listen_port
    await (await getTnInput('listen_port')).setValue('3270');

    // Form should be valid because we didn't modify the basename
    expect(spectator.component.form.valid).toBe(true);

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    // Should successfully call the API
    expect(api.call).toHaveBeenCalledWith('iscsi.global.update', [
      expect.objectContaining({
        listen_port: 3270,
      }),
    ]);
  });
});
