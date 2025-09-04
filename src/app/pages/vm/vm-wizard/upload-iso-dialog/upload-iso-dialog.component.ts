import { HttpEventType, HttpProgressEvent, HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog, MatDialogRef, MatDialogTitle, MatDialogClose } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  catchError, of, Subject, Subscription, takeUntil, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { mntPath } from 'app/enums/mnt-path.enum';
import { Role } from 'app/enums/role.enum';
import { helptextVmWizard } from 'app/helptext/vm/vm-wizard/vm-wizard';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import {
  ExplorerCreateDatasetComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { UploadService } from 'app/services/upload.service';

@UntilDestroy()
@Component({
  selector: 'ix-upload-iso-dialog',
  templateUrl: './upload-iso-dialog.component.html',
  styleUrls: ['./upload-iso-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    IxExplorerComponent,
    IxFileInputComponent,
    FormActionsComponent,
    MatButton,
    MatDialogClose,
    TestDirective,
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
  private dialogRef = inject<MatDialogRef<UploadIsoDialogComponent, string | null>>(MatDialogRef);
  private uploadService = inject(UploadService);
  private loader = inject(LoaderService);
  private snackbar = inject(SnackbarService);
  private dialogService = inject(DialogService);

  form = this.formBuilder.nonNullable.group({
    path: [mntPath],
    files: [[] as File[]],
  });

  readonly directoryNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });
  readonly helptext = helptextVmWizard;
  protected readonly requiredRoles = [Role.VmWrite];

  private destroy$ = new Subject<void>();
  private uploadSubscription: Subscription | null = null;
  private loaderCloseSubscription: Subscription | null = null;
  private cancelUpload: (() => void) | null = null;
  private matDialog = inject(MatDialog);

  ngOnDestroy(): void {
    // Cancel any ongoing upload and cleanup when component is destroyed
    if (this.cancelUpload) {
      this.cancelUpload();
      this.cancelUpload = null;
    }
    if (this.uploadSubscription) {
      this.uploadSubscription.unsubscribe();
      this.uploadSubscription = null;
    }
    if (this.loaderCloseSubscription) {
      this.loaderCloseSubscription.unsubscribe();
      this.loaderCloseSubscription = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
    // Remove confirmation handler before closing
    this.loader.removeConfirmationBeforeClose();
    this.loader.close();
  }

  private closeAllConfirmationDialogs(): void {
    // Force close any open confirmation dialogs (but not the upload dialog itself)
    const openDialogs = this.matDialog.openDialogs;
    openDialogs.forEach((dialog) => {
      // Only close dialogs that are not this upload dialog
      if (dialog !== this.dialogRef) {
        dialog.close();
      }
    });
  }

  onSubmit(): void {
    const { path, files } = this.form.getRawValue();
    const file = files[0];
    const uploadPath = `${path}/${file.name}`;

    // Cancel any existing upload before starting new one
    if (this.cancelUpload) {
      this.cancelUpload();
      this.cancelUpload = null;
    }
    if (this.uploadSubscription) {
      this.uploadSubscription.unsubscribe();
      this.uploadSubscription = null;
    }
    if (this.loaderCloseSubscription) {
      this.loaderCloseSubscription.unsubscribe();
      this.loaderCloseSubscription = null;
    }

    // Ensure loader is closed before starting new upload
    this.loader.close();

    const loaderClosed$ = this.loader.open();

    const { observable: observable$, cancel } = this.uploadService.upload({
      file,
      method: 'filesystem.put',
      params: [uploadPath, { mode: 493 }],
    });

    this.cancelUpload = cancel;

    // Set up confirmation handler for when user tries to close the loader
    this.loader.setConfirmationBeforeClose(() => {
      // Prevent confirmations after upload is done
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

    // Handle when loader is closed (either by cancel confirmation or programmatically)
    this.loaderCloseSubscription = loaderClosed$.pipe(
      takeUntil(this.destroy$),
    ).subscribe(() => {
      // Remove the confirmation handler
      this.loader.removeConfirmationBeforeClose();


      if (this.cancelUpload) {
        this.cancelUpload();
        this.cancelUpload = null;
        this.snackbar.success(this.translate.instant('Upload cancelled'));
      }
      if (this.uploadSubscription) {
        this.uploadSubscription.unsubscribe();
        this.uploadSubscription = null;
      }
    });

    this.uploadSubscription = observable$
      .pipe(
        tap((event: HttpProgressEvent) => {
          if (event instanceof HttpResponse) {
            // Remove confirmation handler and force close any open confirmation dialogs
            this.loader.removeConfirmationBeforeClose();
            this.closeAllConfirmationDialogs();

            // Clean up subscriptions before closing loader to avoid triggering cancellation
            if (this.loaderCloseSubscription) {
              this.loaderCloseSubscription.unsubscribe();
              this.loaderCloseSubscription = null;
            }

            this.loader.close();
            this.uploadSubscription = null;
            this.cancelUpload = null;

            // Show success message and close dialog
            this.snackbar.success(this.translate.instant('ISO uploaded successfully'));
            this.dialogRef.close(uploadPath);
          }

          if (event.type === HttpEventType.UploadProgress && event.total) {
            const percentDone = Math.round(100 * event.loaded / event.total);
            this.loader.setTitle(
              this.translate.instant('{n}% Uploaded', { n: percentDone }),
            );
          }
        }),
        catchError((error: unknown) => {
          // Immediately remove confirmation handler and force close any open confirmation dialogs
          this.loader.removeConfirmationBeforeClose();
          this.closeAllConfirmationDialogs();

          // Force close the loader immediately to prevent any further interactions
          this.loader.close();

          // Clean up subscriptions
          if (this.loaderCloseSubscription) {
            this.loaderCloseSubscription.unsubscribe();
            this.loaderCloseSubscription = null;
          }

          this.uploadSubscription = null;
          this.cancelUpload = null;

          // Don't show error for aborted requests or network failures that might be user-initiated
          if (error instanceof DOMException && (error.name === 'AbortError' || error.name === 'NetworkError')) {
            return of(null);
          }

          // Show error modal and keep dialog open for retry
          this.errorHandler.showErrorModal(error);
          return of(error);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }
}
