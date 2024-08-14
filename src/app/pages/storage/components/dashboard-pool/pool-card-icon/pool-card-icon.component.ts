import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';

@UntilDestroy()
@Component({
  selector: 'ix-pool-card-icon',
  templateUrl: './pool-card-icon.component.html',
  styleUrls: ['./pool-card-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolCardIconComponent {
  readonly type = input.required<PoolCardIconType>();
  readonly tooltip = input<string>();

  readonly poolCardIconType = PoolCardIconType;
}
