import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';

@Component({
  selector: 'ix-label',
  templateUrl: './ix-label.component.html',
  styleUrls: ['./ix-label.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxLabelComponent {
  @Input() label: string;
  @Input() required = false;
  @Input() tooltip: string;
}
