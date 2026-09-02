import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementReason } from 'app/enums/entitlement-reason.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { NvmeOfGlobalConfig } from 'app/interfaces/nvme-of.interface';
import { Service } from 'app/interfaces/service.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  NvmeOfConfigurationComponent,
} from 'app/pages/sharing/nvme-of/nvme-of-configuration/nvme-of-configuration.component';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';
import { selectEntitlements } from 'app/store/entitlements/entitlements.selectors';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectServices } from 'app/store/services/services.selectors';

describe('NvmeOfConfigurationComponent', () => {
  let spectator: Spectator<NvmeOfConfigurationComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: NvmeOfConfigurationComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('nvmet.global.update'),
        mockCall('nvmet.global.config', {
          ana: true,
          rdma: true,
          kernel: true,
          xport_referral: false,
          basenqn: 'iqn.2005-10.org.freenas:ctl',
        } as NvmeOfGlobalConfig),
      ]),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(),
      }),
      provideMockStore({
        selectors: [
          { selector: selectEntitlements, value: {} },
          {
            selector: selectIsHaLicensed,
            value: true,
          },
          {
            // Loaded map with no gated keys, i.e. entitled to everything.
            selector: selectEntitlements,
            value: {},
          },
          {
            selector: selectServices,
            value: [{
              id: 1,
              service: ServiceName.NvmeOf,
              state: ServiceStatus.Stopped,
              enable: false,
              pids: [],
            } as Service],
          },
        ],
      }),
      mockProvider(NvmeOfService, {
        isRdmaCapable: jest.fn(() => of(true)),
      }),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('loads current global config when component is initialized', () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.global.config');
  });

  it('shows current values for global settings', async () => {
    const formValues = await form.getValues();

    expect(formValues).toEqual({
      'Base NQN': 'iqn.2005-10.org.freenas:ctl',
      'Implementation (Experimental)': 'Linux Kernel',
      'Enable Asymmetric Namespace Access (ANA)': true,
      'Enable Remote Direct Memory Access (RDMA)': true,
    });
  });

  it('saves form values when Save is pressed', async () => {
    await form.fillForm({
      'Base NQN': 'new.2005-10.org.freenas:ctl',
      'Implementation (Experimental)': 'SPDK (userspace)',
      'Enable Asymmetric Namespace Access (ANA)': true,
      'Enable Remote Direct Memory Access (RDMA)': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.global.update', [{
      ana: true,
      basenqn: 'new.2005-10.org.freenas:ctl',
      rdma: true,
      kernel: false,
    }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  });

  it('disables RDMA control if RDMA support is missing from the system', async () => {
    spectator.inject(NvmeOfService).isRdmaCapable.mockReturnValue(of(false));
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);

    const controls = await form.getDisabledState();
    expect(controls).toMatchObject({
      'Enable Remote Direct Memory Access (RDMA)': true,
    });
  });

  it('disables ANA for systems without HA license', async () => {
    spectator.inject(MockStore).overrideSelector(selectIsHaLicensed, false);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);

    const controls = await form.getDisabledState();
    expect(controls).toMatchObject({
      'Enable Asymmetric Namespace Access (ANA)': true,
    });
  });

  it('disables Implementation field when NVMe service is running', async () => {
    spectator.inject(MockStore).overrideSelector(selectServices, [{
      id: 1,
      service: ServiceName.NvmeOf,
      state: ServiceStatus.Running,
      enable: true,
      pids: [1234],
    } as Service]);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);

    const controls = await form.getDisabledState();
    expect(controls).toMatchObject({
      'Implementation (Experimental)': true,
    });
  });

  it('hides the Implementation field when the system is not entitled to NVMEOF_SPDK', async () => {
    spectator.inject(MockStore).overrideSelector(selectEntitlements, {
      [EntitlementFeature.NvmeOfSpdk]: {
        entitled: false,
        reason: EntitlementReason.KeyMissing,
        message: 'SPDK is limited to enterprise licensed systems only.',
      },
    });
    spectator.inject(MockStore).refreshState();
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);

    const formValues = await form.getValues();
    expect(formValues).toEqual({
      'Base NQN': 'iqn.2005-10.org.freenas:ctl',
      'Enable Asymmetric Namespace Access (ANA)': true,
      'Enable Remote Direct Memory Access (RDMA)': true,
    });
  });

  it('omits kernel from the payload when the system is not entitled to NVMEOF_SPDK', async () => {
    spectator.inject(MockStore).overrideSelector(selectEntitlements, {
      [EntitlementFeature.NvmeOfSpdk]: {
        entitled: false,
        reason: EntitlementReason.KeyMissing,
        message: 'SPDK is limited to enterprise licensed systems only.',
      },
    });
    spectator.inject(MockStore).refreshState();
    spectator.inject(NvmeOfService).isRdmaCapable.mockReturnValue(of(true));
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.global.update', [{
      ana: true,
      basenqn: 'iqn.2005-10.org.freenas:ctl',
      rdma: true,
    }]);
  });
});
