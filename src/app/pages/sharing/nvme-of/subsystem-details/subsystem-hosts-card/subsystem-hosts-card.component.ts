import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

@Component({
  selector: 'ix-subsystem-hosts-card',
  templateUrl: './subsystem-hosts-card.component.html',
  styleUrl: './subsystem-hosts-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    TranslateModule,
    MatTooltip,
  ],
})
export class SubsystemHostsCardComponent {
  subsystem = input.required<NvmeOfSubsystemDetails>();

  protected helptext = helptextNvmeOf;
}
