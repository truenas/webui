import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { NvmeOfTransportType } from 'app/enums/nvme-of.enum';
import { NvmeOfPort } from 'app/interfaces/nvme-of.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { PortFormComponent } from 'app/pages/sharing/nvme-of/ports/port-form/port-form.component';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';

describe('PortFormComponent', () => {
  let spectator: Spectator<PortFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const newPort = { id: 1 } as NvmeOfPort;
  const slideInGetData = jest.fn((): NvmeOfPort | undefined => undefined);
  const createComponent = createComponentFactory({
    component: PortFormComponent,
    providers: [
      mockApi([
        mockCall('nvmet.port.create', newPort),
        mockCall('nvmet.port.update'),
        mockCall('nvmet.port.transport_address_choices', {
          '10.220.8.1': '10.220.8.1',
          '10.220.8.2': '10.220.8.2',
        }),
      ]),
      mockProvider(NvmeOfService, {
        getSupportedTransports: jest.fn(() => of([
          NvmeOfTransportType.Tcp,
          NvmeOfTransportType.Rdma,
        ])),
      }),
      mockProvider(SlideInRef, {
        getData: slideInGetData,
        close: jest.fn(),
      }),
      mockProvider(AuthService, {
        hasRole: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('creates a new port when form is submitted', async () => {
    await form.fillForm({
      'Transport Type': 'TCP',
      Port: '20000',
      Address: '10.220.8.1',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.port.create', [{
      addr_trtype: NvmeOfTransportType.Tcp,
      addr_traddr: '10.220.8.1',
      addr_trsvcid: 20000,
    }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({
      response: newPort,
    });
  });

  it('uses default port 4420 when no port is specified', async () => {
    await form.fillForm({
      'Transport Type': 'TCP',
      Address: '10.220.8.1',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.port.create', [{
      addr_trtype: NvmeOfTransportType.Tcp,
      addr_traddr: '10.220.8.1',
      addr_trsvcid: 4420,
    }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({
      response: newPort,
    });
  });

  it('only shows supported transports in the Transport Type select', async () => {
    expect(spectator.inject(NvmeOfService).getSupportedTransports).toHaveBeenCalled();

    const select = await form.getControl('Transport Type') as IxSelectHarness;
    const transportOptions = await select.getOptionLabels();

    expect(transportOptions).toEqual(['TCP', 'RDMA']);
  });

  it('loads addresses based on the transport type selected', async () => {
    await form.fillForm({
      'Transport Type': 'RDMA',
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.port.transport_address_choices', [NvmeOfTransportType.Rdma]);
  });

  it('shows empty port field when creating a new port', async () => {
    const formValues = await form.getValues();
    expect(formValues).toEqual(expect.objectContaining({
      Port: '',
    }));
  });

  it('applies default only for TCP/RDMA, not for other transport types', async () => {
    // Test that when submitting with empty port and transport type is RDMA
    await form.fillForm({
      'Transport Type': 'RDMA',
      Address: '10.220.8.1',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    // Should apply default port 4420 for RDMA
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.port.create', [{
      addr_trtype: NvmeOfTransportType.Rdma,
      addr_traddr: '10.220.8.1',
      addr_trsvcid: 4420,
    }]);
  });

  describe('edits', () => {
    beforeEach(() => {
      slideInGetData.mockReturnValue({
        id: 23,
        addr_traddr: '10.220.8.2',
        addr_trtype: NvmeOfTransportType.Tcp,
        addr_trsvcid: 15000,
      } as NvmeOfPort);

      spectator.component.ngOnInit();
    });

    it('shows current values when editing an existing port', async () => {
      const formValues = await form.getValues();
      expect(formValues).toEqual({
        'Transport Type': 'TCP',
        Port: '15000',
        Address: '10.220.8.2',
      });
    });

    it('updates an existing port', async () => {
      await form.fillForm({
        'Transport Type': 'TCP',
        Port: '20000',
        Address: '10.220.8.1',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.port.update', [23, {
        addr_trtype: NvmeOfTransportType.Tcp,
        addr_traddr: '10.220.8.1',
        addr_trsvcid: 20000,
      }]);
    });

    it('applies default port when updating with empty port field', async () => {
      await form.fillForm({
        'Transport Type': 'TCP',
        Port: '',
        Address: '10.220.8.1',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.port.update', [23, {
        addr_trtype: NvmeOfTransportType.Tcp,
        addr_traddr: '10.220.8.1',
        addr_trsvcid: 4420,
      }]);
    });
  });
});
