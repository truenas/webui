import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NvmeOfTransportType } from 'app/enums/nvme-of.enum';
import { NvmeOfPort } from 'app/interfaces/nvme-of.interface';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { ApiService } from 'app/modules/websocket/api.service';
import { PortFormComponent } from 'app/pages/sharing/nvme-of/ports/port-form/port-form.component';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';

describe('PortFormComponent', () => {
  let spectator: Spectator<PortFormComponent>;
  let loader: HarnessLoader;
  const newPort = { id: 1 } as NvmeOfPort;
  const updatedPort = { id: 23 } as NvmeOfPort;

  const getTnInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getTnSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const createComponent = createComponentFactory({
    component: PortFormComponent,
    providers: [
      mockApi([
        mockCall('nvmet.port.create', newPort),
        // The real endpoint returns the updated record, and the openers rely on it — a `undefined`
        // response would make `closed` emit undefined, which SlideInResult reads as a cancel.
        mockCall('nvmet.port.update', updatedPort),
        mockCall('nvmet.port.transport_address_choices', {
          '10.220.8.1': '10.220.8.1',
          '10.220.8.2': '10.220.8.2',
        }),
      ]),
      mockAuth(),
      mockProvider(NvmeOfService, {
        getSupportedTransports: jest.fn(() => of([
          NvmeOfTransportType.Tcp,
          NvmeOfTransportType.Rdma,
        ])),
      }),
      ...ixFormTestingProviders(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('creates a new port when form is submitted', async () => {
    const closedSpy = jest.fn();
    spectator.component.closed.subscribe(closedSpy);

    // The host panel's footer Save reads canSubmit(), so assert the gate here — address is required.
    expect(spectator.component.canSubmit()).toBe(false);

    await (await getTnSelect('addr_trtype')).selectOption('TCP');
    await (await getTnInput('addr_trsvcid')).setValue('20000');
    await (await getTnSelect('addr_traddr')).selectOption('10.220.8.1');

    expect(spectator.component.canSubmit()).toBe(true);

    spectator.component.submit();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.port.create', [{
      addr_trtype: NvmeOfTransportType.Tcp,
      addr_traddr: '10.220.8.1',
      addr_trsvcid: 20000,
    }]);
    // The created record is handed back through `closed` so the add-port picker can select it.
    expect(closedSpy).toHaveBeenCalledWith(newPort);
  });

  it('uses default port 4420 when no port is specified', async () => {
    const closedSpy = jest.fn();
    spectator.component.closed.subscribe(closedSpy);

    await (await getTnSelect('addr_trtype')).selectOption('TCP');
    await (await getTnSelect('addr_traddr')).selectOption('10.220.8.1');

    spectator.component.submit();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.port.create', [{
      addr_trtype: NvmeOfTransportType.Tcp,
      addr_traddr: '10.220.8.1',
      addr_trsvcid: 4420,
    }]);
    expect(closedSpy).toHaveBeenCalledWith(newPort);
  });

  it('only shows supported transports in the Transport Type select', async () => {
    expect(spectator.inject(NvmeOfService).getSupportedTransports).toHaveBeenCalled();

    const select = await getTnSelect('addr_trtype');
    await select.open();
    const transportOptions = await select.getOptions();

    expect(transportOptions).toEqual(['TCP', 'RDMA']);
  });

  it('loads addresses based on the transport type selected', async () => {
    await (await getTnSelect('addr_trtype')).selectOption('RDMA');

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.port.transport_address_choices', [NvmeOfTransportType.Rdma]);
  });

  it('shows empty port field when creating a new port', async () => {
    expect(await (await getTnInput('addr_trsvcid')).getValue()).toBe('');
  });

  it('applies default only for TCP/RDMA, not for other transport types', async () => {
    await (await getTnSelect('addr_trtype')).selectOption('RDMA');
    await (await getTnSelect('addr_traddr')).selectOption('10.220.8.1');

    spectator.component.submit();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.port.create', [{
      addr_trtype: NvmeOfTransportType.Rdma,
      addr_traddr: '10.220.8.1',
      addr_trsvcid: 4420,
    }]);
  });

  describe('edits', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          port: {
            id: 23,
            addr_traddr: '10.220.8.2',
            addr_trtype: NvmeOfTransportType.Tcp,
            addr_trsvcid: 15000,
          } as NvmeOfPort,
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows current values when editing an existing port', async () => {
      expect(await (await getTnSelect('addr_trtype')).getDisplayText()).toBe('TCP');
      expect(await (await getTnInput('addr_trsvcid')).getValue()).toBe('15000');
      expect(await (await getTnSelect('addr_traddr')).getDisplayText()).toBe('10.220.8.2');
    });

    it('updates an existing port', async () => {
      const closedSpy = jest.fn();
      spectator.component.closed.subscribe(closedSpy);

      await (await getTnSelect('addr_trtype')).selectOption('TCP');
      await (await getTnInput('addr_trsvcid')).setValue('20000');
      await (await getTnSelect('addr_traddr')).selectOption('10.220.8.1');

      spectator.component.submit();

      expect(closedSpy).toHaveBeenCalledWith(updatedPort);
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.port.update', [23, {
        addr_trtype: NvmeOfTransportType.Tcp,
        addr_traddr: '10.220.8.1',
        addr_trsvcid: 20000,
      }]);
    });

    it('applies default port when updating with empty port field', async () => {
      const portEl = spectator.query('[formControlName="addr_trsvcid"] input') as HTMLInputElement;
      portEl.value = '';
      portEl.dispatchEvent(new Event('input'));
      spectator.detectChanges();
      await (await getTnSelect('addr_traddr')).selectOption('10.220.8.1');

      spectator.component.submit();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.port.update', [23, {
        addr_trtype: NvmeOfTransportType.Tcp,
        addr_traddr: '10.220.8.1',
        addr_trsvcid: 4420,
      }]);
    });
  });
});
