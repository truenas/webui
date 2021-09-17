import { Component, Input } from '@angular/core';

@Component({
  selector: 'ix-fieldset',
  templateUrl: './ix-fieldset.component.html',
  styleUrls: ['./ix-fieldset.component.scss'],
})
export class IxFieldset {
  @Input() disable: boolean;
  @Input() title: string;
  @Input() divider: boolean;
}
