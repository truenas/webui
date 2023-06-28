import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'ix-warning',
  templateUrl: './ix-warning.component.html',
  styleUrls: ['./ix-warning.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxWarningComponent {
  @Input() message: string;
  @Input() color: 'green' | 'orange' = 'orange';
}
