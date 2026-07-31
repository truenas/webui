import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  TnCheckboxHarness, TnInputHarness, TnRadioHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { NvmeOfGlobalConfig } from 'app/interfaces/nvme-of.interface';
import { Service } from 'app/interfaces/service.interface';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  NvmeOfConfigurationComponent,
} from 'app/pages/sharing/nvme-of/nvme-of-configuration/nvme-of-configuration.component';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectServices } from 'app/store/services/services.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

describe('NvmeOfConfigurationComponent', () => {
  let spectator: Spectator<NvmeOfConfigurationComponent>;
  let loader: HarnessLoader;
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
      ...ixFormTestingProviders(),
      provideMockStore({
        selectors: [
          {
            selector: selectIsHaLicensed,
            value: true,
          },
          {
            selector: selectIsEnterprise,
            value: true,
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
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads current global config when component is initialized', () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.global.config');
  });

  it('shows current values for global settings', async () => {
    const basenqn = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="basenqn"]' }));
    expect(await basenqn.getValue()).toBe('iqn.2005-10.org.freenas:ctl');

    const kernelRadio = await loader.getHarness(TnRadioHarness.with({ label: 'Linux Kernel' }));
    expect(await kernelRadio.isChecked()).toBe(true);

    const ana = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Enable Asymmetric Namespace Access (ANA)' }),
    );
    expect(await ana.isChecked()).toBe(true);

    const rdma = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Enable Remote Direct Memory Access (RDMA)' }),
    );
    expect(await rdma.isChecked()).toBe(true);
  });

  it('saves form values when the side panel host submits', async () => {
    const closedSpy = jest.fn();
    spectator.component.closed.subscribe(closedSpy);

    const basenqn = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="basenqn"]' }));
    await basenqn.setValue('new.2005-10.org.freenas:ctl');

    const spdkRadio = await loader.getHarness(TnRadioHarness.with({ label: 'SPDK (userspace)' }));
    await spdkRadio.check();

    expect(spectator.component.canSubmit()).toBe(true);
    spectator.component.submit();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.global.update', [{
      ana: true,
      basenqn: 'new.2005-10.org.freenas:ctl',
      rdma: true,
      kernel: false,
    }]);
    expect(closedSpy).toHaveBeenCalledWith(true);
  });

  it('reports unsaved changes to the side panel close guard once the form is edited', async () => {
    expect(spectator.component.hasUnsavedChanges()).toBe(false);

    const basenqn = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="basenqn"]' }));
    await basenqn.setValue('new.2005-10.org.freenas:ctl');

    expect(spectator.component.hasUnsavedChanges()).toBe(true);
  });

  it('disables RDMA control if RDMA support is missing from the system', async () => {
    spectator.inject(NvmeOfService).isRdmaCapable.mockReturnValue(of(false));
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    const rdma = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Enable Remote Direct Memory Access (RDMA)' }),
    );
    expect(await rdma.isDisabled()).toBe(true);
  });

  it('disables ANA for systems without HA license', async () => {
    spectator.inject(MockStore).overrideSelector(selectIsHaLicensed, false);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    const ana = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Enable Asymmetric Namespace Access (ANA)' }),
    );
    expect(await ana.isDisabled()).toBe(true);
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

    const kernelRadio = await loader.getHarness(TnRadioHarness.with({ label: 'Linux Kernel' }));
    expect(await kernelRadio.isDisabled()).toBe(true);
  });

  it('hides Implementation field on non-enterprise systems', async () => {
    spectator.inject(MockStore).overrideSelector(selectIsEnterprise, false);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    const radios = await loader.getAllHarnesses(TnRadioHarness);
    expect(radios).toHaveLength(0);
  });

  it('does not include kernel in payload when saving on non-enterprise systems', () => {
    spectator.inject(MockStore).overrideSelector(selectIsEnterprise, false);
    spectator.inject(NvmeOfService).isRdmaCapable.mockReturnValue(of(true));
    spectator = createComponent();

    spectator.component.submit();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.global.update', [{
      ana: true,
      basenqn: 'iqn.2005-10.org.freenas:ctl',
      rdma: true,
    }]);
  });
});
