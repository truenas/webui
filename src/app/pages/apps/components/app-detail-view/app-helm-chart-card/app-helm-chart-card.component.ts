import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { Observable } from 'rxjs';
import { AvailableApp } from 'app/interfaces/available-app.interface';

@Component({
  selector: 'ix-app-helm-chart-card',
  templateUrl: './app-helm-chart-card.component.html',
  styleUrls: ['./app-helm-chart-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHelmChartCardComponent {
  @Input() isLoading$: Observable<boolean>;
  @Input() app: AvailableApp;
}
