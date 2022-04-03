import { Component, Input } from '@angular/core';

@Component({
  selector: 'ix-input-group',
  templateUrl: './ix-input-group.component.html',
  styleUrls: ['./ix-input-group.component.scss'],
})
export class IxInputGroupComponent {
  @Input() label: string;
  @Input() tooltip: string;
  @Input() required: boolean;
  @Input() hint: string;
}
