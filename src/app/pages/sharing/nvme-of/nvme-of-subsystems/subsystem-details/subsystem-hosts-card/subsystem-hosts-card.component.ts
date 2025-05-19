import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SubsystemWithRelations } from 'app/pages/sharing/nvme-of/utils/subsystem-with-relations.interface';

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
  subsystem = input.required<SubsystemWithRelations>();

  protected helptext = helptextNvmeOf;
}
