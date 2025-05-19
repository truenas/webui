import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { NvmeOfTransportType } from 'app/enums/nvme-of.enum';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import {
  SubsystemPortsCardComponent,
} from 'app/pages/sharing/nvme-of/nvme-of-subsystems/subsystem-details/subsystem-ports-card/subsystem-ports-card.component';
import { NvmeOfSubsystemDetails } from 'app/pages/sharing/nvme-of/services/nvme-of-subsystem-details.interface';

describe('SubsystemPortsCardComponent', () => {
  let spectator: Spectator<SubsystemPortsCardComponent>;
  const createComponent = createComponentFactory({
    component: SubsystemPortsCardComponent,
  });

  it('shows a warning when subsystem has no ports', () => {
    spectator = createComponent({
      props: {
        subsystem: {
          id: 1,
          ports: [],
        } as NvmeOfSubsystemDetails,
      },
    });

    const warning = spectator.query('.no-ports-warning');
    expect(warning).toBeTruthy();
    expect(warning.textContent).toContain(helptextNvmeOf.noPortsWarning);
    expect(warning).toHaveDescendant('ix-icon');
  });

  it('lists ports associated with the subsystem', () => {
    spectator = createComponent({
      props: {
        subsystem: {
          id: 1,
          ports: [
            {
              addr_trsvcid: 7000,
              addr_trtype: NvmeOfTransportType.Tcp,
              addr_traddr: '10.23.23.12',
            },
            {
              addr_trsvcid: 6000,
              addr_trtype: NvmeOfTransportType.Rdma,
              addr_traddr: '192.168.1.5',
            },
            {
              addr_trtype: NvmeOfTransportType.FibreChannel,
              addr_traddr: 'nn-0x20000025b500a123',
            },
          ],
        } as NvmeOfSubsystemDetails,
      },
    });

    const portList = spectator.queryAll('.port-list li');
    expect(portList).toHaveLength(3);
    expect(portList[0].textContent).toContain('TCP — 10.23.23.12:7000');
    expect(portList[1].textContent).toContain('RDMA — 192.168.1.5:6000');
    expect(portList[2].textContent).toContain('Fibre Channel — nn-0x20000025b500a123');
  });
});
