import { Dialog, DialogRef } from '@angular/cdk/dialog';
import {
  HttpEvent, HttpEventType, HttpProgressEvent, HttpResponse,
} from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnDialogShellComponent, TnFileInputComponent, TnFormFieldComponent,
  TnFormSectionComponent,
} from '@truenas/ui-components';
import {
  defer, EMPTY, filter, finalize, map, Observable, of, take, takeUntil, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextVmWizard } from 'app/helptext/vm/vm-wizard/vm-wizard';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import {
  ExplorerCreateDatasetComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import {
  IxFormComponent, SubmitResult, ixFormMinSubmitFeedbackMs,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { validateNotPoolRoot } from 'app/modules/forms/ix-forms/validators/validators';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { UploadService } from 'app/services/upload.service';

@Component({
  selector: 'ix-upload-iso-dialog',
  templateUrl: './upload-iso-dialog.component.html',
  styleUrls: ['./upload-iso-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [
    // The submit-feedback hold exists so a `<tn-side-panel>`'s progress bar is perceptible on a
    // fast save. The upload puts the global loader on screen for its whole duration, so holding
    // here would only delay the close.
    { provide: ixFormMinSubmitFeedbackMs, useValue: 0 },
  ],
  imports: [
    TnDialogShellComponent,
    ReactiveFormsModule,
    IxFormComponent,
    IxExplorerComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnFileInputComponent,
    FormActionsComponent,
    TnButtonComponent,
    RequiresRolesDirective,
    TranslateModule,
    ExplorerCreateDatasetComponent,
  ],
})
export class UploadIsoDialogComponent implements OnDestroy {
  private formBuilder = inject(FormBuilder);
  private filesystemService = inject(FilesystemService);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  protected dialogRef = inject<DialogRef<string | null, UploadIsoDialogComponent>>(DialogRef);
  private uploadService = inject(UploadService);
  private loader = inject(LoaderService);
  private snackbar = inject(SnackbarService);
  private dialogService = inject(DialogService);
  private cdkDialog = inject(Dialog);

  /**
   * The shared form wrapper owns validity tracking and the submit lifecycle (submitting state,
   * success snackbar, close); the dialog only re-exposes its Save surface to the `tnDialogAction`
   * footer, and supplies the transfer itself as the wrapper's request.
   */
  private readonly ixForm = viewChild(IxFormComponent);

  readonly helptext = helptextVmWizard;

  form = this.formBuilder.nonNullable.group({
    // Start with empty path instead of '/mnt' to avoid showing immediate validation error
    // Users will use the file explorer to navigate to a valid dataset path
    path: ['', [validateNotPoolRoot(this.translate.instant(this.helptext.upload_iso_pool_root_error))]],
    // tn-file-input in single mode emits File | null (ix-file-input used File[]).
    files: [null as File | null, Validators.required],
  });

  readonly directoryNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });
  protected readonly requiredRoles = [Role.VmWrite];

  // Aborts the in-flight XHR. Non-null only while a transfer is actually running, which is what
  // makes it safe for both the cancel confirmation and `ngOnDestroy` to call unconditionally.
  private cancelUpload: (() => void) | null = null;

  ngOnDestroy(): void {
    // The wrapper unsubscribes its own request on destroy, which tears the loader down through
    // `finalize`; the XHR behind it has to be aborted explicitly.
    this.cancelUpload?.();
    this.cancelUpload = null;
  }

  protected canSubmit(): boolean {
    return this.ixForm()?.canSubmit() ?? false;
  }

  protected submit(): void {
    this.ixForm()?.submit();
  }

  protected handleSubmit = (): SubmitResult<string, string> => {
    const { path, files: file } = this.form.getRawValue();
    if (!file) {
      // Unreachable while `files` carries `Validators.required` (the wrapper won't submit an
      // invalid form), but the payload below dereferences the file, so bail rather than assert.
      return { request$: EMPTY, successMessage: () => null, closeWith: () => '' };
    }

    const uploadPath = `${path}/${file.name}`;

    return {
      request$: this.uploadIso(file, uploadPath),
      successMessage: this.translate.instant('ISO uploaded successfully'),
      closeWith: () => uploadPath,
      onError: (error: unknown) => {
        // Don't report aborted requests or network failures that may be user-initiated, and keep
        // the dialog open in every case so the upload can be retried without re-picking the file.
        if (!(error instanceof DOMException && (error.name === 'AbortError' || error.name === 'NetworkError'))) {
          this.errorHandler.showErrorModal(error);
        }
        return true;
      },
    };
  };

  /**
   * The transfer, as a single-emission request the `<ix-form>` wrapper can drive: it emits once
   * the server has accepted the file and completes, errors if the upload fails, and — when the
   * user cancels — completes WITHOUT emitting, which drops the wrapper back out of its submitting
   * state and leaves the dialog open instead of reporting a save that did not happen.
   *
   * `defer` so the loader only opens (and the XHR only starts) when the wrapper subscribes.
   */
  private uploadIso(file: File, uploadPath: string): Observable<string> {
    return defer(() => {
      const loaderClosed$ = this.loader.open();
      const { observable: upload$, cancel } = this.uploadService.upload({
        file,
        method: 'filesystem.put',
        params: [uploadPath, { mode: 493 }],
      });
      this.cancelUpload = cancel;

      this.loader.setConfirmationBeforeClose(() => {
        // Prevent confirmations after the upload is done.
        if (!this.cancelUpload) {
          return of(false);
        }

        return this.dialogService.confirm({
          title: this.translate.instant('Cancel Upload'),
          message: this.translate.instant('Are you sure you want to cancel the upload? This will stop the current upload process.'),
          hideCheckbox: true,
          buttonText: this.translate.instant('Cancel Upload'),
          cancelText: this.translate.instant('Keep Uploading'),
          hideCancel: false,
        });
      });

      // The loader is only dismissible through that confirmation, so its close means the user
      // asked to abort.
      const cancelled$ = loaderClosed$.pipe(tap(() => {
        this.cancelUpload?.();
        this.cancelUpload = null;
        this.snackbar.success(this.translate.instant('Upload cancelled'));
      }));

      return upload$.pipe(
        tap((event) => this.reportProgress(event)),
        filter((event) => event instanceof HttpResponse),
        take(1),
        // End the transfer before the wrapper reports success, so the dialog never closes out
        // from under a loader that is still on screen.
        tap(() => this.endUpload()),
        map(() => uploadPath),
        takeUntil(cancelled$),
        // Success, failure, cancellation and the dialog being destroyed all land here, and all
        // four mean the loader and its confirmation must go.
        finalize(() => this.endUpload()),
      );
    });
  }

  private reportProgress(event: HttpEvent<unknown>): void {
    if (event.type !== HttpEventType.UploadProgress) {
      return;
    }

    const progress = event as HttpProgressEvent;
    if (!progress.total) {
      return;
    }

    const percentDone = Math.round(100 * progress.loaded / progress.total);
    this.loader.setTitle(this.translate.instant('{n}% Uploaded', { n: percentDone }));
  }

  private endUpload(): void {
    this.cancelUpload = null;
    this.loader.removeConfirmationBeforeClose();
    this.closeAllConfirmationDialogs();
    this.loader.close();
  }

  private closeAllConfirmationDialogs(): void {
    // Force close any open confirmation dialogs (but not the upload dialog itself)
    const openDialogs = this.cdkDialog.openDialogs;
    openDialogs.forEach((dialog) => {
      // Only close dialogs that are not this upload dialog
      if (dialog !== this.dialogRef) {
        dialog.close();
      }
    });
  }
}
