import {
  ChangeDetectionStrategy, Component,
  input, computed,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { formatRelative } from 'date-fns';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { CleanLinkPipe } from 'app/modules/pipes/clean-link/clean-link.pipe';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-app-available-info-card',
  templateUrl: './app-available-info-card.component.html',
  styleUrls: ['./app-available-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgxSkeletonLoaderModule,
    OrNotAvailablePipe,
    TranslateModule,
    TestDirective,
    CleanLinkPipe,
  ],
})
export class AppAvailableInfoCardComponent {
  readonly isLoading = input<boolean>(true);
  readonly app = input<AvailableApp>();
  readonly relativeDate = computed(() => {
    const app = this.app();
    if (!app) {
      return '';
    }
    return formatRelative(new Date(app.last_update.$date), new Date());
  });
}
