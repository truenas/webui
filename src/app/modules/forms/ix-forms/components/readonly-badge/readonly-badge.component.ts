import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';

@Component({
  selector: 'ix-readonly-badge',
  templateUrl: './readonly-badge.component.html',
  styleUrls: ['./readonly-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [IxIconModule, TranslateModule],
})
export class ReadOnlyComponent {

}
