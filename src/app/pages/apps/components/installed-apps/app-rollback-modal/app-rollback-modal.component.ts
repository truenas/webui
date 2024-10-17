import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, of, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { App, AppRollbackParams } from 'app/interfaces/app.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-rollback-modal',
  templateUrl: './app-rollback-modal.component.html',
  styleUrls: ['./app-rollback-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    IxSelectComponent,
    IxCheckboxComponent,
    TranslateModule,
    FormActionsComponent,
    MatButton,
    RequiresRolesDirective,
    TestDirective,
    MatDialogActions,
    MatDialogClose,
  ],
})
export class AppRollbackModalComponent {
  form = this.formBuilder.group({
    app_version: ['', Validators.required],
    rollback_snapshot: [false],
  });

  versionOptions$: Observable<Option[]>;

  readonly helptext = helptextApps.apps.rollback_dialog.version.tooltip;
  protected readonly requiredRoles = [Role.AppsWrite];

  constructor(
    private dialogRef: MatDialogRef<AppRollbackModalComponent>,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private formBuilder: FormBuilder,
    private errorHandler: ErrorHandlerService,
    @Inject(MAT_DIALOG_DATA) private app: App,
  ) {
    this.setVersionOptions();
  }

  onRollback(): void {
    const rollbackParams = [this.app.name, this.form.value] as Required<AppRollbackParams>;

    this.dialogService.jobDialog(
      this.ws.job('app.rollback', rollbackParams),
      { title: helptextApps.apps.rollback_dialog.job },
    )
      .afterClosed()
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe(() => this.dialogRef.close(true));
  }

  private setVersionOptions(): void {
    this.ws.call('app.rollback_versions', [this.app.name]).pipe(
      tap((versions) => {
        const options = versions.map((version) => ({
          label: version,
          value: version,
        }));
        this.versionOptions$ = of(options);
        if (options.length) {
          this.selectFirstVersion(options[0]);
        }
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  private selectFirstVersion(firstOption: Option): void {
    this.form.patchValue({
      app_version: firstOption.value.toString(),
    });
  }
}
