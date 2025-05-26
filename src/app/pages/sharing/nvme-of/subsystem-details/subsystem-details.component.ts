import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NvmeOfSubsystemDetails } from 'app/pages/sharing/nvme-of/services/nvme-of-subsystem-details.interface';
import {
  SubsystemDetailsCardComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-details-card/subsystem-details-card.component';
import {
  SubsystemHostsCardComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-hosts-card/subsystem-hosts-card.component';
import {
  SubsystemPortsCardComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-ports-card/subsystem-ports-card.component';

@Component({
  selector: 'ix-subsystem-details',
  standalone: true,
  templateUrl: './subsystem-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SubsystemPortsCardComponent,
    SubsystemHostsCardComponent,
    SubsystemDetailsCardComponent,
  ],
})
export class SubsystemDetailsComponent {
  readonly subsystem = input.required<NvmeOfSubsystemDetails>();
}
