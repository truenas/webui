import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SummarySection } from 'app/modules/common/summary/summary.interface';

@Component({
  selector: 'ix-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryComponent {
  @Input() summary: SummarySection[];
}
