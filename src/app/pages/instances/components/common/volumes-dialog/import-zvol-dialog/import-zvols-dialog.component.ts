import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogClose, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { zvolsRootNode } from 'app/constants/basic-root-nodes.constant';
import { instancesHelptext } from 'app/helptext/instances/instances';
import { RadioOption } from 'app/interfaces/option.interface';
import { ZvolToImport } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FilesystemService } from 'app/services/filesystem.service';

@UntilDestroy()
@Component({
  selector: 'ix-import-zvol-dialog',
  imports: [
    MatDialogTitle,
    TranslateModule,
    ReactiveFormsModule,
    IxExplorerComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
    IxRadioGroupComponent,
  ],
  templateUrl: './import-zvols-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportZvolsDialog {
  private formBuilder = inject(NonNullableFormBuilder);
  private filesystem = inject(FilesystemService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private dialogRef = inject<MatDialogRef<ImportZvolsDialog, boolean>>(MatDialogRef);
  private snackbar = inject(SnackbarService);

  protected form = this.formBuilder.group({
    zvols: [[] as string[], Validators.required],
    clone: [false],
  });

  protected readonly zvolsRootNodes = [zvolsRootNode];

  protected zvolProvider = this.filesystem.getFilesystemNodeProvider({
    zvolsOnly: true,
  });

  protected cloneOrMoveOptions$ = of<RadioOption[]>([
    {
      label: this.translate.instant('Clone'),
      tooltip: this.translate.instant(instancesHelptext.importZvol.cloneTooltip),
      value: true,
    },
    {
      label: this.translate.instant('Move'),
      tooltip: this.translate.instant(instancesHelptext.importZvol.moveTooltip),
      value: false,
    },
  ]);

  protected helptext = instancesHelptext;

  protected onSubmit(): void {
    const toImport = this.form.getRawValue().zvols.map((zvol) => {
      const volumeName = zvol.split('/').pop();

      return {
        virt_volume_name: volumeName,
        zvol_path: zvol,
      } as ZvolToImport;
    });

    const job$ = this.api.job('virt.volume.import_zvol', [{
      clone: this.form.getRawValue().clone,
      to_import: toImport,
    }]);

    this.dialogService.jobDialog(
      job$,
      { title: this.translate.instant('Importing') },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Import completed'));
        this.dialogRef.close(true);
      });
  }
}
