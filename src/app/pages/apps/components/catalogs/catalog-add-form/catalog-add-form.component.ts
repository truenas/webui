import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import helptext from 'app/helptext/apps/apps';
import { CatalogCreate } from 'app/interfaces/catalog.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

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
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private translate: TranslateService,
    private snackbar: SnackbarService,
  ) {}

  onSubmit(): void {
    const values = this.form.value;

    this.isFormLoading = true;
    this.ws.call('catalog.create', [values as CatalogCreate])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
          this.snackbar.success(
            this.translate.instant('Adding large catalogs can take minutes. Please check on the progress in Task Manager.'),
          );
          this.slideInService.closeAll();
        },
        error: (error) => {
          this.isFormLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }
}
