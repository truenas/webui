import {
  Component, ChangeDetectionStrategy, input, computed,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnTestIdDirective } from '@truenas/ui-components';
import { normalizeFileSize } from 'app/helpers/file-size.utils';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AppStats } from 'app/interfaces/app.interface';
import { mapLoadedValue } from 'app/modules/loader/directives/with-loading-state/map-loaded-value.utils';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';

@Component({
  selector: 'ix-app-memory-info',
  templateUrl: './app-memory-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WithLoadingStateDirective, TranslateModule, TnTestIdDirective],
})
export class AppMemoryInfoComponent {
  /** The app's name: one app's stats can show in several widgets, and several apps' on one dashboard. */
  testId = input.required<string>();
  stats = input.required<LoadingState<AppStats>>();

  protected memory = computed(() => {
    return mapLoadedValue(this.stats(), (value) => normalizeFileSize(value.memory));
  });
}
