import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'ix-app-available-info-card',
  templateUrl: './app-available-info-card.component.html',
  styleUrls: ['./app-available-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppAvailableInfoCardComponent {
  @Input() isLoading$: Observable<boolean>;
}
