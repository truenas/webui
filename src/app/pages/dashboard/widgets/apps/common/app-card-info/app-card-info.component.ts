import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AppStartQueryParams } from 'app/interfaces/chart-release-event.interface';
import { App } from 'app/interfaces/chart-release.interface';
import { Job } from 'app/interfaces/job.interface';

@Component({
  selector: 'ix-app-card-info',
  templateUrl: './app-card-info.component.html',
  styleUrls: ['./app-card-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppCardInfoComponent {
  app = input.required<LoadingState<App>>();
  job = input.required<Job<void, AppStartQueryParams>>();
}
