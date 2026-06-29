import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { NvmeOfGlobalConfig } from 'app/interfaces/nvme-of.interface';
import { Service } from 'app/interfaces/service.interface';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
      mockProvider(SlideInRef, {
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(),
      }),
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
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  async function clickSave(): Promise<void> {
    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();
  }

  it('loads current global config when component is initialized', () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.global.config');
  });

  it('shows current values for global settings', () => {
    expect(spectator.component.form.getRawValue()).toEqual({
      basenqn: 'iqn.2005-10.org.freenas:ctl',
      kernel: true,
      ana: true,
      rdma: true,
    });
  });

  it('saves form values when Save is pressed', async () => {
    spectator.component.form.patchValue({
      basenqn: 'new.2005-10.org.freenas:ctl',
      kernel: false,
      ana: true,
      rdma: true,
    });
    spectator.detectChanges();

    await clickSave();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.global.update', [{
      ana: true,
      basenqn: 'new.2005-10.org.freenas:ctl',
      rdma: true,
      kernel: false,
    }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  });

  it('disables RDMA control if RDMA support is missing from the system', () => {
    spectator.inject(NvmeOfService).isRdmaCapable.mockReturnValue(of(false));
    spectator = createComponent();

    expect(spectator.component.form.controls.rdma.disabled).toBe(true);
  });

  it('disables ANA for systems without HA license', () => {
    spectator.inject(MockStore).overrideSelector(selectIsHaLicensed, false);
    spectator = createComponent();

    expect(spectator.component.form.controls.ana.disabled).toBe(true);
  });

  it('disables Implementation field when NVMe service is running', () => {
    spectator.inject(MockStore).overrideSelector(selectServices, [{
      id: 1,
      service: ServiceName.NvmeOf,
      state: ServiceStatus.Running,
      enable: true,
      pids: [1234],
    } as Service]);
    spectator = createComponent();

    expect(spectator.component.form.controls.kernel.disabled).toBe(true);
  });

  it('hides Implementation field on non-enterprise systems', () => {
    spectator.inject(MockStore).overrideSelector(selectIsEnterprise, false);
    spectator = createComponent();
    spectator.detectChanges();

    expect(spectator.query('tn-radio')).toBeNull();
  });

  it('does not include kernel in payload when saving on non-enterprise systems', async () => {
    spectator.inject(MockStore).overrideSelector(selectIsEnterprise, false);
    spectator.inject(NvmeOfService).isRdmaCapable.mockReturnValue(of(true));
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    await clickSave();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.global.update', [{
      ana: true,
      basenqn: 'iqn.2005-10.org.freenas:ctl',
      rdma: true,
    }]);
  });
});
