import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { isSedLockedPool } from 'app/pages/storage/components/dashboard-pool/offline-pool-warning/offline-pool.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

/**
 * Shown for a configured pool that ZFS has not imported (see `isOfflinePool`), with a way to import
 * it again once whatever kept it from importing at boot — usually locked SED disks — is resolved.
 */
@Component({
  selector: 'ix-offline-pool-warning',
  templateUrl: './offline-pool-warning.component.html',
  styleUrls: ['./offline-pool-warning.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconComponent,
    MatButton,
    TestDirective,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class OfflinePoolWarningComponent {
  private router = inject(Router);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  readonly pool = input.required<Pool>();

  readonly importSuccess = output();

  protected readonly requiredRoles = [Role.PoolWrite];

  protected readonly isSedLocked = computed(() => isSedLockedPool(this.pool()));

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
