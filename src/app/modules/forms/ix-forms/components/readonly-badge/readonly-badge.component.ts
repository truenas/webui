import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';

@Component({
  selector: 'ix-readonly-badge',
  templateUrl: './readonly-badge.component.html',
  styleUrls: ['./readonly-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TnIconComponent, TranslateModule],
})
export class ReadOnlyComponent {

}
