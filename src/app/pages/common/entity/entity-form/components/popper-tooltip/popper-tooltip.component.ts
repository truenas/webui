import { Component, Input } from '@angular/core';

@Component({
  selector: 'popper-tooltip',
  styleUrls: ['./popper-tooltip.component.scss'],
  templateUrl: './popper-tooltip.component.html',
})
export class PopperTooltipComponent {
  @Input('message') message: string;
  @Input('header') header?: string;
}
