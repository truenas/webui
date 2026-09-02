import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { NonNullableFormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnDialogShellComponent, TnFormFieldComponent, TnInputComponent,
} from '@truenas/ui-components';
import { emptyRootNode } from 'app/constants/basic-root-nodes.constant';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextReplication } from 'app/helptext/data-protection/replication/replication';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult, ixFormMinSubmitFeedbackMs,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetService } from 'app/services/dataset/dataset.service';

interface ReplicationRestoreFormValue {
  name: string;
  target_dataset: string;
}

@Component({
  selector: 'ix-replication-restore-dialog',
  templateUrl: './replication-restore-dialog.component.html',
  styleUrls: ['./replication-restore-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    // The submit-feedback hold exists so a `<tn-side-panel>`'s progress bar is perceptible on a
    // fast save. A dialog has no such indicator (the global loader below covers the request), so
    // holding here would only delay the close.
    { provide: ixFormMinSubmitFeedbackMs, useValue: 0 },
  ],
  imports: [
    TnDialogShellComponent,
    ReactiveFormsModule,
    IxFormComponent,
    TnFormFieldComponent,
    TnInputComponent,
    IxExplorerComponent,
    FormActionsComponent,
    TnButtonComponent,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class ReplicationRestoreDialog {
  private api = inject(ApiService);
  private loader = inject(LoaderService);
  private formBuilder = inject(NonNullableFormBuilder);
  private datasetService = inject(DatasetService);
  private translate = inject(TranslateService);
  protected dialogRef = inject<DialogRef<unknown, ReplicationRestoreDialog>>(DialogRef);
  private parentTaskId = inject(DIALOG_DATA);

  /**
   * The shared form wrapper owns the submit lifecycle (loading, snackbar, validation-error
   * mapping); the dialog only re-exposes its Save surface to the `tnDialogAction` footer.
   */
  private readonly ixForm = viewChild(IxFormComponent);

  protected readonly requiredRoles = [Role.ReplicationTaskWrite, Role.ReplicationTaskWritePull];

  protected form = this.formBuilder.group({
    name: ['', Validators.required],
    target_dataset: ['', Validators.required],
  });

  readonly treeNodeProvider = this.datasetService.getDatasetNodeProvider();
  // The dataset provider works with relative dataset names ("tank/child").
  protected readonly rootNodes = [emptyRootNode];
  readonly helptext = helptextReplication;

  protected canSubmit(): boolean {
    return this.ixForm()?.canSubmit() ?? false;
  }

  protected submit(): void {
    this.ixForm()?.submit();
  }

  protected handleSubmit = (event: FormSubmitEvent<ReplicationRestoreFormValue>): SubmitResult => ({
    request$: this.api
      .call('replication.restore', [this.parentTaskId, event.allValues])
      .pipe(this.loader.withLoader()),
    successMessage: this.translate.instant('Replication task restored.'),
  });
}
