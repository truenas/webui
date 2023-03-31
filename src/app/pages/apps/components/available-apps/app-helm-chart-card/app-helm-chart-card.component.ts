import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'ix-app-helm-chart-card',
  templateUrl: './app-helm-chart-card.component.html',
  styleUrls: ['./app-helm-chart-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHelmChartCardComponent {
  @Input() isLoading$: Observable<boolean>;
}
