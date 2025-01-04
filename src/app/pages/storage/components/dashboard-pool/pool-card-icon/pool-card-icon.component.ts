import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

@UntilDestroy()
@Component({
  selector: 'ix-pool-card-icon',
  templateUrl: './pool-card-icon.component.html',
  styleUrls: ['./pool-card-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxIconComponent,
    MatTooltip,
    TranslateModule,
  ],
})
export class PoolCardIconComponent {
  readonly type = input.required<PoolCardIconType>();
  readonly tooltip = input.required<string>();

  readonly poolCardIconType = PoolCardIconType;
}
