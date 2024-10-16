import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AppStats } from 'app/interfaces/app.interface';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';

@Component({
  selector: 'ix-app-cpu-info',
  templateUrl: './app-cpu-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [WithLoadingStateDirective, TranslateModule],
})
export class AppCpuInfoComponent {
  stats = input.required<LoadingState<AppStats>>();
}
