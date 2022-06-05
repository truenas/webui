import { Component, Input } from '@angular/core';

@Component({
  selector: 'ix-tooltip',
  styleUrls: ['./tooltip.component.scss'],
  templateUrl: './tooltip.component.html',
})
export class TooltipComponent {
  @Input() message: string;
  @Input() header?: string;
}
