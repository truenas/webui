import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnTestIdDirective } from '@truenas/ui-components';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AppStats } from 'app/interfaces/app.interface';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';

@Component({
  selector: 'ix-app-cpu-info',
  templateUrl: './app-cpu-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WithLoadingStateDirective, TranslateModule, TnTestIdDirective],
})
export class AppCpuInfoComponent {
  /** The app's name: one app's stats can show in several widgets, and several apps' on one dashboard. */
  testId = input.required<string>();
  stats = input.required<LoadingState<AppStats>>();
}
