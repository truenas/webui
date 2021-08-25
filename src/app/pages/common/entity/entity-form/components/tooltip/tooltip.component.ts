import { Component, Input } from '@angular/core';

@Component({
  selector: 'tooltip',
  styleUrls: ['./tooltip.component.scss'],
  templateUrl: './tooltip.component.html',
})
export class PopperTooltipComponent {
  @Input('message') message: string;
  @Input('header') header?: string;
}
