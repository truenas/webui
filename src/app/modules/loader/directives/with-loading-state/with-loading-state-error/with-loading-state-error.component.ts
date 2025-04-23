import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ErrorParserService } from 'app/services/errors/error-parser.service';

@Component({
  selector: 'ix-with-loading-state-error',
  templateUrl: './with-loading-state-error.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
})
export class WithLoadingStateErrorComponent {
  readonly error = input<unknown>();

  constructor(
    private errorParser: ErrorParserService,
    private translate: TranslateService,
  ) {}

  protected errorMessage = computed(() => {
    return this.errorParser.getFirstErrorMessage(this.error()) || this.translate.instant('Error');
  });
}
