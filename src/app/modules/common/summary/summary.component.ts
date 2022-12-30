import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type Summary = Record<string, string>;

@Component({
  selector: 'ix-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryComponent {
  @Input() summary: Summary;
}
