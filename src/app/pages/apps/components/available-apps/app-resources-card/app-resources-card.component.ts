import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'ix-app-resources-card',
  templateUrl: './app-resources-card.component.html',
  styleUrls: ['./app-resources-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppResourcesCardComponent {
  @Input() isLoading$: Observable<boolean>;
}
