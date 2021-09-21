import { Component, Input } from '@angular/core';

@Component({
  selector: 'tooltip',
  styleUrls: ['./tooltip.component.scss'],
  templateUrl: './tooltip.component.html',
})
export class TooltipComponent {
  @Input() message: string;
  @Input() header?: string;
}
