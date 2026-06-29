import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnSelectHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { NvmeOfTransportType } from 'app/enums/nvme-of.enum';
import { NvmeOfPort } from 'app/interfaces/nvme-of.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { PortFormComponent } from 'app/pages/sharing/nvme-of/ports/port-form/port-form.component';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';

describe('PortFormComponent', () => {
  let spectator: Spectator<PortFormComponent>;
  let loader: HarnessLoader;
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
        requireConfirmationWhen: jest.fn(),
      }),
      mockProvider(AuthService, {
        hasRole: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(() => {
    slideInGetData.mockReturnValue(undefined);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  async function clickSave(): Promise<void> {
    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();
  }

  it('creates a new port when form is submitted', async () => {
    spectator.component.form.patchValue({
      addr_trtype: NvmeOfTransportType.Tcp,
      addr_trsvcid: 20000,
      addr_traddr: '10.220.8.1',
    });
    spectator.detectChanges();

    await clickSave();

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
    spectator.component.form.patchValue({
      addr_trtype: NvmeOfTransportType.Tcp,
      addr_traddr: '10.220.8.1',
    });
    spectator.detectChanges();

    await clickSave();

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

    const select = await loader.getHarness(TnSelectHarness);
    await select.open();

    expect(await select.getOptions()).toEqual(['TCP', 'RDMA']);
  });

  it('loads addresses based on the transport type selected', () => {
    spectator.component.form.controls.addr_trtype.setValue(NvmeOfTransportType.Rdma);
    spectator.detectChanges();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.port.transport_address_choices', [NvmeOfTransportType.Rdma]);
  });

  it('shows empty port field when creating a new port', () => {
    expect(spectator.component.form.controls.addr_trsvcid.value).toBeNull();
  });

  it('applies default only for TCP/RDMA, not for other transport types', async () => {
    spectator.component.form.patchValue({
      addr_trtype: NvmeOfTransportType.Rdma,
      addr_traddr: '10.220.8.1',
    });
    spectator.detectChanges();

    await clickSave();

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
      spectator.detectChanges();
    });

    it('shows current values when editing an existing port', () => {
      expect(spectator.component.form.getRawValue()).toEqual({
        addr_trtype: NvmeOfTransportType.Tcp,
        addr_trsvcid: 15000,
        addr_traddr: '10.220.8.2',
      });
    });

    it('updates an existing port', async () => {
      spectator.component.form.patchValue({
        addr_trtype: NvmeOfTransportType.Tcp,
        addr_trsvcid: 20000,
        addr_traddr: '10.220.8.1',
      });
      spectator.detectChanges();

      await clickSave();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.port.update', [23, {
        addr_trtype: NvmeOfTransportType.Tcp,
        addr_traddr: '10.220.8.1',
        addr_trsvcid: 20000,
      }]);
    });

    it('applies default port when updating with empty port field', async () => {
      spectator.component.form.patchValue({
        addr_trtype: NvmeOfTransportType.Tcp,
        addr_trsvcid: null,
        addr_traddr: '10.220.8.1',
      });
      spectator.detectChanges();

      await clickSave();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.port.update', [23, {
        addr_trtype: NvmeOfTransportType.Tcp,
        addr_traddr: '10.220.8.1',
        addr_trsvcid: 4420,
      }]);
    });
  });
});
