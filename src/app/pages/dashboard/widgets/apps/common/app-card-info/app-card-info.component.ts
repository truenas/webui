import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { App, AppStartQueryParams } from 'app/interfaces/app.interface';
import { Job } from 'app/interfaces/job.interface';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { AppStateCellComponent } from 'app/pages/apps/components/installed-apps/app-state-cell/app-state-cell.component';
import { AppUpdateCellComponent } from 'app/pages/apps/components/installed-apps/app-update-cell/app-update-cell.component';
import { AppVersionPipe } from 'app/pages/dashboard/widgets/apps/common/utils/app-version.pipe';

@Component({
  selector: 'ix-app-card-info',
  templateUrl: './app-card-info.component.html',
  styleUrls: ['./app-card-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    WithLoadingStateDirective,
    AppStateCellComponent,
    AppUpdateCellComponent,
    AppVersionPipe,
  ],
})
export class AppCardInfoComponent {
  app = input.required<LoadingState<App>>();
  job = input.required<Job<void, AppStartQueryParams>>();
}
