import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { CatalogCreate } from 'app/interfaces/catalog.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';

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
    label: helptextApps.catalogForm.name.tooltip,
    force: helptextApps.catalogForm.forceCreate.tooltip,
    repository: helptextApps.catalogForm.repository.tooltip,
    preferred_trains: helptextApps.catalogForm.preferredTrains.tooltip,
    branch: helptextApps.catalogForm.branch.tooltip,
  };

  protected readonly requiredRoles = [Role.CatalogWrite];

  constructor(
    private slideInRef: IxSlideInRef<CatalogAddFormComponent>,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private matDialog: MatDialog,
    private dialogService: DialogService,
  ) {}

  onSubmit(): void {
    const values = this.form.value;

    this.isFormLoading = true;

    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: {
        title: helptextApps.catalogForm.title,
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
      this.slideInRef.close(true);
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
      this.isFormLoading = false;
      this.cdr.markForCheck();
      dialogRef.close();
      this.dialogService.closeAllDialogs();
      this.errorHandler.handleWsFormError(error, this.form);
    });
  }
}
