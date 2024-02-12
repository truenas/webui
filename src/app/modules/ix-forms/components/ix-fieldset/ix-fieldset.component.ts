import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ix-fieldset',
  templateUrl: './ix-fieldset.component.html',
  styleUrls: ['./ix-fieldset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxFieldsetComponent {
  @Input() disable: boolean;
  @Input() title: string;
  @Input() divider: boolean;
  @Input() tooltip: string;
}
