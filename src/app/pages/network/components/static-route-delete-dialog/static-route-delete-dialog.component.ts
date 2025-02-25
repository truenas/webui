import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { StaticRoute } from 'app/interfaces/static-route.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-static-route-delete-dialog',
  templateUrl: './static-route-delete-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    FormActionsComponent,
    MatDialogActions,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class StaticRouteDeleteDialogComponent {
  protected readonly requiredRoles = [Role.NetworkInterfaceWrite];

  readonly deleteMessage = T('Are you sure you want to delete static route <b>"{name}"</b>?');

  constructor(
    private loader: AppLoaderService,
    private api: ApiService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<StaticRouteDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public route: StaticRoute,
    private errorHandler: ErrorHandlerService,
  ) { }

  onDelete(): void {
    this.api.call('staticroute.delete', [this.route.id])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Static route deleted'));
        this.dialogRef.close(true);
      });
  }
}
