import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import {
  MatCard, MatCardContent, MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { VirtualizationStatus } from 'app/enums/virtualization.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { CardExpandCollapseComponent } from 'app/modules/card-expand-collapse/card-expand-collapse.component';

@UntilDestroy()
@Component({
  selector: 'ix-instance-idmap',
  templateUrl: './instance-idmap.component.html',
  styleUrls: ['./instance-idmap.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardTitle,
    MatCardHeader,
    TranslateModule,
    MatCardContent,
    CardExpandCollapseComponent,
  ],
})
export class InstanceIdmapComponent {
  instance = input.required<VirtualizationInstance>();

  virtualizationStatus = VirtualizationStatus;
}
