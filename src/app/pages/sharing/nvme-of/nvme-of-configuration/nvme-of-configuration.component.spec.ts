import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NvmeOfGlobalConfig } from 'app/interfaces/nvme-of.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  NvmeOfConfigurationComponent,
} from 'app/pages/sharing/nvme-of/nvme-of-configuration/nvme-of-configuration.component';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/utils/nvme-of.service';

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
          xport_referral: false,
          basenqn: 'iqn.2005-10.org.freenas:ctl',
        } as NvmeOfGlobalConfig),
      ]),
      mockProvider(SlideInRef, {
        close: jest.fn(),
      }),
      mockProvider(NvmeOfService, {
        isRdmaEnabled: jest.fn(() => of(true)),
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
      'Enable Asymmetric Namespace Access': true,
      'Enable Remote Direct Memory Access (RDMA)': true,
      'Generate Cross-port Referrals for Ports On This System': false,
    });
  });

  it('saves form values when Save is pressed', async () => {
    await form.fillForm({
      'Base NQN': 'new.2005-10.org.freenas:ctl',
      'Enable Asymmetric Namespace Access': true,
      'Enable Remote Direct Memory Access (RDMA)': true,
      'Generate Cross-port Referrals for Ports On This System': false,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.global.update', [{
      ana: true,
      basenqn: 'new.2005-10.org.freenas:ctl',
      rdma: true,
      xport_referral: false,
    }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  });

  it('disables RDMA control if RDMA support is missing from the system', async () => {
    spectator.inject(NvmeOfService).isRdmaEnabled.mockReturnValue(of(false));
    spectator.component.ngOnInit();

    const controls = await form.getDisabledState();
    expect(controls).toMatchObject({
      'Enable Remote Direct Memory Access (RDMA)': true,
    });
  });
});
