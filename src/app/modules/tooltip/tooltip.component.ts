import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ix-tooltip',
  styleUrls: ['./tooltip.component.scss'],
  templateUrl: './tooltip.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipComponent {
  @Input() message: string;
  @Input() header?: string;
}
