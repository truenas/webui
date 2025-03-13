import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ErrorParserService } from 'app/services/errors/error-parser.service';

@Component({
  selector: 'ix-with-loading-state-error',
  templateUrl: './with-loading-state-error.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule],
})
export class WithLoadingStateErrorComponent {
  readonly error = input<unknown>();

  constructor(
    private errorParser: ErrorParserService,
  ) {}

  protected errorMessage = computed(() => {
    return this.errorParser.getFirstErrorMessage(this.error());
  });
}
