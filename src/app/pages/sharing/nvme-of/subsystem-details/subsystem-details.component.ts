import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import {
  SubsystemDetailsCardComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-details-card/subsystem-details-card.component';
import { subsystemDetailsElements } from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-details.elements';
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
    SubsystemDetailsCardComponent,
    SubsystemNamespacesCardComponent,
    UiSearchDirective,
  ],
})
export class SubsystemDetailsComponent {
  readonly subsystem = input.required<NvmeOfSubsystemDetails>();
  protected readonly searchableElements = subsystemDetailsElements;
}
