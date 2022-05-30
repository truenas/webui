import { Component, Input } from '@angular/core';

@Component({
  templateUrl: './text-limiter-tooltip.component.html',
  styleUrls: ['./text-limiter-tooltip.component.scss'],
})
export class TextLimiterTooltipComponent {
  @Input() text = '';
}
