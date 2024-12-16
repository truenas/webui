import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { isApiError } from 'app/helpers/api.helper';
import { ApiError } from 'app/interfaces/api-error.interface';

@Component({
  selector: 'ix-with-loading-state-error',
  templateUrl: './with-loading-state-error.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule],
})
export class WithLoadingStateErrorComponent {
  readonly error = input<Error | ApiError>();

  protected errorMessage = computed(() => {
    const error = this.error();
    if (isApiError(error)) {
      return error?.reason || error.error.toString();
    }
    if (error instanceof Error) {
      return error.message;
    }
    return '';
  });
}
