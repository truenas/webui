import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { NvmeOfTransportType } from 'app/enums/nvme-of.enum';
import { NvmeOfPort } from 'app/interfaces/nvme-of.interface';
import { PortDescriptionComponent } from 'app/pages/sharing/nvme-of/ports/port-description/port-description.component';

describe('PortDescriptionComponent', () => {
  let spectator: Spectator<PortDescriptionComponent>;
  const createComponent = createComponentFactory({
    component: PortDescriptionComponent,
  });

  it('shows port type, address and port if they are available', () => {
    spectator = createComponent({
      props: {
        port: {
          addr_trsvcid: 7000,
          addr_trtype: NvmeOfTransportType.Tcp,
          addr_traddr: '10.23.23.12',
        } as NvmeOfPort,
      },
    });

    expect(spectator.fixture.nativeElement).toHaveText('TCP\n—\n10.23.23.12:7000');
  });

  it('shows port type and address if port is not available', () => {
    spectator = createComponent({
      props: {
        port: {
          addr_trtype: NvmeOfTransportType.FibreChannel,
          addr_traddr: 'nn-0x20000025b500a123',
        } as NvmeOfPort,
      },
    });

    expect(spectator.fixture.nativeElement).toHaveText('Fibre Channel\n—\nnn-0x20000025b500a123');
  });
});
