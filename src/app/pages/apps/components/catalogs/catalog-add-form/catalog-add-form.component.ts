import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import helptext from 'app/helptext/apps/apps';
import { CatalogCreate } from 'app/interfaces/catalog.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';

@UntilDestroy()
@Component({
  templateUrl: './catalog-add-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogAddFormComponent {
  isFormLoading = false;

  form = this.fb.group({
    label: ['', Validators.required],
    force: [false],
    repository: ['', Validators.required],
    preferred_trains: [['stable']],
    branch: ['main'],
  });

  readonly tooltips = {
    label: helptext.catalogForm.name.tooltip,
    force: helptext.catalogForm.forceCreate.tooltip,
    repository: helptext.catalogForm.repository.tooltip,
    preferred_trains: helptext.catalogForm.preferredTrains.tooltip,
    branch: helptext.catalogForm.branch.tooltip,
  };

  constructor(
    private slideInRef: IxSlideInRef<CatalogAddFormComponent>,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private mdDialog: MatDialog,
    private dialogService: DialogService,
  ) {}

  onSubmit(): void {
    const values = this.form.value;

    this.isFormLoading = true;

    const dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: {
        title: helptext.catalogForm.title,
      },
    });
    dialogRef.componentInstance.setCall('catalog.create', [values as CatalogCreate]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.isFormLoading = false;
      this.cdr.markForCheck();
      this.dialogService.closeAllDialogs();
      this.snackbar.success(
        this.translate.instant('Catalog is being added. This may take some time. You can minimize this dialog and process will continue in background'),
      );
      this.slideInRef.close();
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
      this.isFormLoading = false;
      this.cdr.markForCheck();
      this.dialogService.closeAllDialogs();
      this.errorHandler.handleWsFormError(error, this.form);
    });
  }
}
