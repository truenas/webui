import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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
  @Input() type: PoolCardIconType;
  @Input() tooltip: string;

  readonly poolCardIconType = PoolCardIconType;
}
