import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TnIconComponent } from '@truenas/ui-components';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';

@Component({
  selector: 'ix-pool-card-icon',
  templateUrl: './pool-card-icon.component.html',
  styleUrls: ['./pool-card-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconComponent,
  ],
})
export class PoolCardIconComponent {
  readonly type = input.required<PoolCardIconType>();
  readonly tooltip = input.required<string>();

  readonly poolCardIconType = PoolCardIconType;
}
