import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { chartsTrain } from 'app/constants/catalog.constants';
import helptext from 'app/helptext/apps/apps';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
import { DialogService, WebSocketService } from 'app/services';
import { IxModalService } from 'app/services/ix-modal.service';

@UntilDestroy()
@Component({
  templateUrl: './catalog-add-form.component.html',
  styleUrls: ['./catalog-add-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogAddFormComponent {
  isFormLoading = false;

  form = this.fb.group({
    label: ['', Validators.required],
    force: [false],
    repository: ['', Validators.required],
    preferred_trains: [[chartsTrain]],
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
    private modalService: IxModalService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private dialogService: DialogService,
  ) {}

  onSubmit(): void {
    const values = this.form.value;

    this.isFormLoading = true;
    this.ws.call('catalog.create', [values])
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.isFormLoading = false;
        this.dialogService.info(
          helptext.catalogForm.dialog.title, helptext.catalogForm.dialog.message, '500px', 'info', true,
        );
        this.modalService.close();
      }, (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      });
  }
}
