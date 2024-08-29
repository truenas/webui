import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { NgClass } from '@angular/common';

@UntilDestroy()
@Component({
  selector: 'ix-warning',
  templateUrl: './ix-warning.component.html',
  styleUrls: ['./ix-warning.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgClass, TranslateModule],
})
export class IxWarningComponent {
  readonly message = input<string>();
  readonly color = input<'green' | 'orange'>('orange');
}
