import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogClose, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { instancesHelptext } from 'app/helptext/instances/instances';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { FilesystemService } from 'app/services/filesystem.service';

@UntilDestroy()
@Component({
  selector: 'ix-import-zvol-dialog',
  imports: [
    MatDialogTitle,
    TranslateModule,
    ReactiveFormsModule,
    IxExplorerComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
  ],
  templateUrl: './import-zvols-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportZvolsDialogComponent {
  protected form = this.formBuilder.group({
    zvols: [[] as string[], Validators.required],
    clone: [false],
  });

  protected zvolProvider = this.filesystem.getFilesystemNodeProvider({
    zvolsOnly: true,
  });

  protected helptext = instancesHelptext;

  constructor(
    private formBuilder: NonNullableFormBuilder,
    private filesystem: FilesystemService,
    private api: ApiService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private dialogRef: MatDialogRef<ImportZvolsDialogComponent, boolean>,
    private snackbar: SnackbarService,
  ) {}

  protected onSubmit(): void {
    const toImport = this.form.value.zvols.map((zvol) => {
      const volumeName = zvol.split('/').pop();

      return {
        virt_volume_name: volumeName,
        zvol_path: zvol,
      };
    });

    const job$ = this.api.job('virt.volume.import_zvol', [{
      clone: this.form.value.clone,
      to_import: toImport,
    }]);

    this.dialogService.jobDialog(
      job$,
      { title: this.translate.instant('Importing') },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Import completed'));
        this.dialogRef.close(true);
      });
  }
}
