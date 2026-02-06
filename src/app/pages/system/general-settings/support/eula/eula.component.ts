import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { eulaElements } from 'app/pages/system/general-settings/support/eula/eula.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-eula',
  templateUrl: './eula.component.html',
  styleUrls: ['./eula.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    UiSearchDirective,
    MatDivider,
    MatCardActions,
    MatButton,
    TestDirective,
    RouterLink,
    TranslateModule,
  ],
})
export class EulaComponent implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  eula: string;
  protected readonly searchableElements = eulaElements;

  ngOnInit(): void {
    this.api.call('truenas.get_eula')
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((eula) => {
        this.eula = eula;
        this.cdr.markForCheck();
      });
  }
}
