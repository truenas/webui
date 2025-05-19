import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NvmeOfTransportType } from 'app/enums/nvme-of.enum';
import { NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
import {
  SubsystemHostsCardComponent,
} from 'app/pages/sharing/nvme-of/nvme-of-subsystems/subsystem-details/subsystem-hosts-card/subsystem-hosts-card.component';
import {
  SubsystemPortsCardComponent,
} from 'app/pages/sharing/nvme-of/nvme-of-subsystems/subsystem-details/subsystem-ports-card/subsystem-ports-card.component';
import { SubsystemWithRelations } from 'app/pages/sharing/nvme-of/utils/subsystem-with-relations.interface';

@Component({
  selector: 'ix-subsystem-details',
  standalone: true,
  templateUrl: './subsystem-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SubsystemPortsCardComponent,
    SubsystemHostsCardComponent,
  ],
})
export class SubsystemDetailsComponent {
  readonly subsystem = input.required<NvmeOfSubsystem>();

  test = {
    id: 2,
    allow_any_host: false,
    ports: [
      {
        id: 1,
        addr_trsvcid: 2332,
        addr_trtype: NvmeOfTransportType.Tcp,
        addr_traddr: '10.23.2.2',
      },
      {
        id: 1,
        addr_trsvcid: 2332,
        addr_trtype: NvmeOfTransportType.Tcp,
        addr_traddr: '10.23.2.2',
      },
    ],
    hosts: [
    ],
  } as SubsystemWithRelations;
}
