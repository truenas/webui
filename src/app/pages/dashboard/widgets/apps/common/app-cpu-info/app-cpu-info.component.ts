import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { ChartReleaseStats } from 'app/interfaces/app.interface';

@Component({
  selector: 'ix-app-cpu-info',
  templateUrl: './app-cpu-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppCpuInfoComponent {
  stats = input.required<LoadingState<ChartReleaseStats>>();
}
