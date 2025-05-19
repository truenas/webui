import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { nvmeOfTransportTypeLabels } from 'app/enums/nvme-of.enum';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfPort } from 'app/interfaces/nvme-of.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { SubsystemWithRelations } from 'app/pages/sharing/nvme-of/utils/subsystem-with-relations.interface';

@Component({
  selector: 'ix-subsystem-ports-card',
  templateUrl: './subsystem-ports-card.component.html',
  styleUrl: './subsystem-ports-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    TranslateModule,
    IxIconComponent,
    MapValuePipe,
  ],
})
export class SubsystemPortsCardComponent {
  subsystem = input.required<SubsystemWithRelations>();

  protected helptext = helptextNvmeOf;

  protected typeLabels = nvmeOfTransportTypeLabels;

  protected getPortDescription(port: NvmeOfPort): string {
    const description = port.addr_traddr;
    if (port.addr_trsvcid) {
      return `${description}:${port.addr_trsvcid}`;
    }

    return description;
  }
}
