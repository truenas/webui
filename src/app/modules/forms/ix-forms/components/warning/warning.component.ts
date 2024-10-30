import { NgClass } from '@angular/common';
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
  standalone: true,
  imports: [NgClass, TranslateModule],
})
export class WarningComponent {
  readonly message = input<string>();
  readonly color = input<'green' | 'orange'>('orange');
}
