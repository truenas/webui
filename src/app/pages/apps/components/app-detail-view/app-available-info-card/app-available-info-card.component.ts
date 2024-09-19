import {
  ChangeDetectionStrategy, Component,
  input, computed,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { formatRelative } from 'date-fns';
import { AvailableApp } from 'app/interfaces/available-app.interface';

@UntilDestroy()
@Component({
  selector: 'ix-app-available-info-card',
  templateUrl: './app-available-info-card.component.html',
  styleUrls: ['./app-available-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppAvailableInfoCardComponent {
  readonly isLoading = input<boolean>(true);
  readonly app = input<AvailableApp>();
  readonly relativeDate = computed(() => {
    return formatRelative(new Date(this.app().last_update.$date), new Date());
  });
}
