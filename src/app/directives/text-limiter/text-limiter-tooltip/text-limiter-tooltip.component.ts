import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ix-text-limiter-tooltip',
  templateUrl: './text-limiter-tooltip.component.html',
  styleUrls: ['./text-limiter-tooltip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextLimiterTooltipComponent {
  @Input() text = '';
}
