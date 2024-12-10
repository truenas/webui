import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

@Component({
  selector: 'ix-readonly-badge',
  templateUrl: './readonly-badge.component.html',
  styleUrls: ['./readonly-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IxIconComponent, TranslateModule],
})
export class ReadOnlyComponent {

}
