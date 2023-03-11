import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ChartRelease } from 'app/interfaces/chart-release.interface';

@Component({
  selector: 'ix-app-history-card',
  templateUrl: './app-history-card.component.html',
  styleUrls: ['./app-history-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHistoryCardComponent {
  @Input() app: ChartRelease;
}
