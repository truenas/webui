import {
  Component, ChangeDetectionStrategy, input, computed,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { normalizeFileSize } from 'app/helpers/file-size.utils';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AppStats } from 'app/interfaces/app.interface';
import { mapLoadedValue } from 'app/modules/loader/directives/with-loading-state/map-loaded-value.utils';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';

@Component({
  selector: 'ix-app-memory-info',
  templateUrl: './app-memory-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [WithLoadingStateDirective, TranslateModule],
})
export class AppMemoryInfoComponent {
  stats = input.required<LoadingState<AppStats>>();

  protected memory = computed(() => {
    return mapLoadedValue(this.stats(), (value) => normalizeFileSize(value.memory));
  });
}
