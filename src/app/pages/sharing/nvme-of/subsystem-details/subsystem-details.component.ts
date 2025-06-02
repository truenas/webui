import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import {
  SubsystemHostsCardComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-hosts-card/subsystem-hosts-card.component';
import {
  SubsystemNamespacesCardComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-namespaces-card/subsystem-namespaces-card.component';
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
    SubsystemNamespacesCardComponent,
  ],
})
export class SubsystemDetailsComponent {
  readonly subsystem = input.required<NvmeOfSubsystemDetails>();
}
