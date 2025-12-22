import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, input, output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-sed-locked-warning',
  templateUrl: './sed-locked-warning.component.html',
  styleUrls: ['./sed-locked-warning.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class SedLockedWarningComponent {
  private router = inject(Router);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  readonly pool = input.required<Pool>();

  readonly importSuccess = output();

  protected onViewDisks(): void {
    this.router.navigate(['/storage', 'disks']);
  }

  protected onImportAgain(): void {
    this.dialogService.jobDialog(
      this.api.job('pool.reimport', [this.pool().id]),
      { title: this.translate.instant('Importing Pool') },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      // afterClosed() only emits on job success; errors are thrown and caught by withErrorHandler()
      .subscribe(() => {
        this.importSuccess.emit();
      });
  }
}
