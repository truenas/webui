import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'text-limiter-tooltip',
  templateUrl: './text-limiter-tooltip.component.html',
  styleUrls: ['./text-limiter-tooltip.component.scss'],
})
export class TextLimiterTooltipComponent {
  @Input() text = '';
}
