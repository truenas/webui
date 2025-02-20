import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { RdmaProtocolName, ServiceName } from 'app/enums/service-name.enum';
import { IscsiGlobalConfig } from 'app/interfaces/iscsi-global-config.interface';
import { Service } from 'app/interfaces/service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
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
    getData: jest.fn(() => undefined),
  };

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
      mockProvider(MatDialog),
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
    const form = await loader.getHarness(IxFormHarness);
    const formValues = await form.getValues();

    expect(formValues).toEqual({
      'Base Name': 'iqn.2005-10.org.freenas.ctl',
      'ISNS Servers': ['188.23.4.23', '92.233.1.1'],
      'Pool Available Space Threshold (%)': '20',
      'iSCSI listen port': '3260',
      'Asymmetric Logical Unit Access (ALUA)': false,
      'Enable iSCSI Extensions for RDMA (iSER)': false,
    });
  });

  it('saves form values when Save is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Base Name': 'iqn.new.org.freenas.ctl',
      'ISNS Servers': ['32.12.112.42', '8.2.1.2'],
      'Pool Available Space Threshold (%)': '15',
      'iSCSI listen port': '3270',
      'Asymmetric Logical Unit Access (ALUA)': false,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
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

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
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

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(store$.dispatch).toHaveBeenCalledWith(checkIfServiceIsEnabled({ serviceName: ServiceName.Iscsi }));
  });

  it('disables iSER field unless it is an enterprise system with RDMA capable NIC', async () => {
    const form = await loader.getHarness(IxFormHarness);

    expect(await form.getDisabledState()).toMatchObject({
      'Enable iSCSI Extensions for RDMA (iSER)': true,
    });

    mockStore$.overrideSelector(selectIsEnterprise, true);
    spectator.component.ngOnInit();

    expect(await form.getDisabledState()).toMatchObject({
      'Enable iSCSI Extensions for RDMA (iSER)': false,
    });
  });
});
