import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';

@UntilDestroy()
@Component({
  selector: 'ix-warning',
  templateUrl: './warning.component.html',
  styleUrls: ['./warning.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
})
export class WarningComponent {
  readonly message = input.required<string>();
  readonly color = input<'green' | 'orange'>('orange');
}
