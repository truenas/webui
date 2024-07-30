import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { ChartScaleResult, ChartScaleQueryParams } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { Job } from 'app/interfaces/job.interface';

@Component({
  selector: 'ix-app-card-info',
  templateUrl: './app-card-info.component.html',
  styleUrls: ['./app-card-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppCardInfoComponent {
  app = input.required<LoadingState<ChartRelease>>();
  job = input.required<Job<ChartScaleResult, ChartScaleQueryParams>>();
}
