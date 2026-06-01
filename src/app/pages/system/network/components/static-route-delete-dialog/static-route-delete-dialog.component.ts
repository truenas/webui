import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnDialogShellComponent } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { StaticRoute } from 'app/interfaces/static-route.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-static-route-delete-dialog',
  templateUrl: './static-route-delete-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    FormActionsComponent,
    TestDirective,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class StaticRouteDeleteDialog {
  private loader = inject(LoaderService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  protected dialogRef = inject<DialogRef<unknown, StaticRouteDeleteDialog>>(DialogRef);
  route = inject<StaticRoute>(DIALOG_DATA);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.NetworkInterfaceWrite];

  readonly deleteMessage = T('Are you sure you want to delete static route <b>"{name}"</b>?');

  onDelete(): void {
    this.api.call('staticroute.delete', [this.route.id])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Static route deleted'));
        this.dialogRef.close(true);
      });
  }
}
