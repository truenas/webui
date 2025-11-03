import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import {
  MatCard, MatCardContent, MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { ContainerStatus } from 'app/enums/container.enum';
import { ContainerInstance } from 'app/interfaces/container.interface';

@UntilDestroy()
@Component({
  selector: 'ix-instance-idmap',
  templateUrl: './instance-idmap.component.html',
  styleUrls: ['./instance-idmap.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardTitle,
    MatCardHeader,
    TranslateModule,
    MatCardContent,
  ],
})
export class InstanceIdmapComponent {
  instance = input.required<ContainerInstance>();

  virtualizationStatus = ContainerStatus;
}
