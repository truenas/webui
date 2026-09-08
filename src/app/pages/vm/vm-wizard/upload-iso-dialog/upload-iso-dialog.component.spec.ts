import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpEvent, HttpResponse } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { of, Subject, throwError } from 'rxjs';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { fillControlValues, indexFormControls } from 'app/modules/forms/ix-forms/testing/control-harnesses.helpers';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { UploadIsoDialogComponent } from 'app/pages/vm/vm-wizard/upload-iso-dialog/upload-iso-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { UploadService } from 'app/services/upload.service';

describe('UploadIsoDialogComponent', () => {
  let spectator: Spectator<UploadIsoDialogComponent>;
  let loader: HarnessLoader;
  /**
   * Stands in for the CDK `DialogRef.closed` subject `LoaderService.open()` returns: it emits on
   * EVERY close of the loader, the component's own programmatic one included, not only on a
   * cancellation the user confirmed.
   */
  let loaderClosed$: Subject<void>;

  const createComponent = createComponentFactory({
    component: UploadIsoDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(UploadService, {
        upload: jest.fn(() => ({
          observable: of(new HttpResponse({ status: 200 })),
          cancel: jest.fn(),
        })),
      }),
      mockProvider(FilesystemService, {
        getFilesystemNodeProvider: jest.fn(() => of()),
      }),
      mockProvider(LoaderService, {
        open: jest.fn(() => loaderClosed$),
        // Closing feeds the notifier, as the real service does — that is what makes the
        // success path (which closes the loader itself) distinguishable from a cancellation.
        close: jest.fn(() => loaderClosed$.next()),
        setTitle: jest.fn(),
        setConfirmationBeforeClose: jest.fn(),
        removeConfirmationBeforeClose: jest.fn(),
      }),
      mockProvider(SnackbarService, {
        success: jest.fn(),
      }),
      mockProvider(DialogRef),
      mockProvider(ErrorHandlerService),
      mockAuth(),
    ],
  });

  /** Fills the form's fields by label, across the ix-* explorer and the tn-* controls alike. */
  async function fillForm(values: Record<string, unknown>): Promise<void> {
    await fillControlValues(await indexFormControls(loader), values);
    spectator.detectChanges();
  }

  async function clickUpload(): Promise<void> {
    const uploadButton = await loader.getHarness(TnButtonHarness.with({ label: 'Upload' }));
    await uploadButton.click();
    spectator.detectChanges();
  }

  beforeEach(() => {
    loaderClosed$ = new Subject<void>();
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('uploads new image to the path provided and closes dialog with uploaded path', async () => {
    const upload = fakeFile('new-windows.iso');

    await fillForm({ 'ISO save location': '/mnt/tank/iso' });
    // Native file inputs cannot be populated programmatically; set the control directly.
    spectator.component.form.patchValue({ files: upload });
    spectator.detectChanges();

    await clickUpload();

    expect(spectator.inject(UploadService).upload).toHaveBeenCalledWith(expect.objectContaining({
      file: upload,
      method: 'filesystem.put',
      params: ['/mnt/tank/iso/new-windows.iso', { mode: 493 }],
    }));
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('ISO uploaded successfully');
    // Closing the loader on the success path must not be mistaken for the user cancelling.
    expect(spectator.inject(SnackbarService).success).not.toHaveBeenCalledWith('Upload cancelled');
    expect(spectator.inject(LoaderService).close).toHaveBeenCalled();
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith('/mnt/tank/iso/new-windows.iso');
  });

  it('keeps Upload disabled until a path and a file are both provided', async () => {
    const uploadButton = await loader.getHarness(TnButtonHarness.with({ label: 'Upload' }));
    expect(await uploadButton.isDisabled()).toBe(true);

    // A file on its own is not enough: without a path the upload would target `/<filename>`.
    spectator.component.form.patchValue({ files: fakeFile('test.iso') });
    spectator.detectChanges();
    expect(await uploadButton.isDisabled()).toBe(true);

    // Neither is a path on its own.
    spectator.component.form.patchValue({ files: null });
    await fillForm({ 'ISO save location': '/mnt/tank/iso' });
    expect(await uploadButton.isDisabled()).toBe(true);

    spectator.component.form.patchValue({ files: fakeFile('test.iso') });
    spectator.detectChanges();

    expect(await uploadButton.isDisabled()).toBe(false);
  });

  it('aborts the transfer and leaves the dialog open when the user cancels the upload', async () => {
    const cancel = jest.fn();
    jest.spyOn(spectator.inject(UploadService), 'upload').mockReturnValue({
      observable: new Subject<HttpEvent<unknown>>().asObservable(),
      cancel,
    });

    await fillForm({ 'ISO save location': '/mnt/tank/iso' });
    spectator.component.form.patchValue({ files: fakeFile('test-upload.iso') });
    spectator.detectChanges();

    await clickUpload();

    // The loader is only dismissible through the cancel confirmation, so its close is the cancel.
    loaderClosed$.next();
    spectator.detectChanges();

    expect(cancel).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Upload cancelled');
    expect(spectator.inject(DialogRef).close).not.toHaveBeenCalled();
  });

  it('reports a failed upload without dismissing the error dialog it just opened', async () => {
    jest.spyOn(spectator.inject(UploadService), 'upload').mockReturnValue({
      observable: throwError(() => new Error('HTTP 500: Internal Server Error')),
      cancel: jest.fn(),
    });
    // The error dialog `showErrorModal` opens is on the CDK stack by the time the transfer is
    // torn down; the teardown must leave it there or the failure goes unreported.
    const errorDialog = { close: jest.fn() } as unknown as DialogRef;
    jest.spyOn(spectator.inject(Dialog), 'openDialogs', 'get').mockReturnValue([errorDialog]);

    await fillForm({ 'ISO save location': '/mnt/tank/iso' });
    spectator.component.form.patchValue({ files: fakeFile('test-upload.iso') });
    spectator.detectChanges();

    await clickUpload();

    expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalled();
    expect(errorDialog.close).not.toHaveBeenCalled();
    expect(spectator.inject(DialogRef).close).not.toHaveBeenCalled();
  });

  it('cancels an in-flight upload when the dialog is destroyed', async () => {
    const cancel = jest.fn();
    jest.spyOn(spectator.inject(UploadService), 'upload').mockReturnValue({
      observable: new Subject<HttpEvent<unknown>>().asObservable(),
      cancel,
    });

    await fillForm({ 'ISO save location': '/mnt/tank/iso' });
    spectator.component.form.patchValue({ files: fakeFile('test-upload.iso') });
    spectator.detectChanges();

    await clickUpload();
    expect(cancel).not.toHaveBeenCalled();

    // A real destroy tears `<ix-form>` down first, which unsubscribes the transfer; the abort
    // has to survive that ordering, so drive the whole sequence rather than one hook.
    spectator.fixture.destroy();

    expect(cancel).toHaveBeenCalled();
  });

  describe('path validation', () => {
    it('starts with empty path and form is invalid', () => {
      expect(spectator.component.form.controls.path.value).toBe('');
      expect(spectator.component.form.valid).toBe(false);
    });

    it('rejects /mnt itself', () => {
      spectator.component.form.patchValue({ path: '/mnt' });
      spectator.detectChanges();

      expect(spectator.component.form.controls.path.errors).toEqual({
        poolRoot: {
          message: 'Cannot upload to /mnt or pool root. Please select a dataset under the pool (e.g., /mnt/pool/dataset).',
        },
      });
      expect(spectator.component.form.valid).toBe(false);
    });

    it('rejects pool root paths like /mnt/poolname', () => {
      spectator.component.form.patchValue({ path: '/mnt/tank' });
      spectator.detectChanges();

      expect(spectator.component.form.controls.path.errors).toEqual({
        poolRoot: {
          message: 'Cannot upload to /mnt or pool root. Please select a dataset under the pool (e.g., /mnt/pool/dataset).',
        },
      });
      expect(spectator.component.form.valid).toBe(false);
    });

    it('rejects pool root paths with trailing slash', () => {
      spectator.component.form.patchValue({ path: '/mnt/tank/' });
      spectator.detectChanges();

      expect(spectator.component.form.controls.path.errors).toEqual({
        poolRoot: {
          message: 'Cannot upload to /mnt or pool root. Please select a dataset under the pool (e.g., /mnt/pool/dataset).',
        },
      });
    });

    it('accepts dataset paths like /mnt/poolname/dataset', () => {
      spectator.component.form.patchValue({
        path: '/mnt/tank/iso',
        files: fakeFile('test.iso'),
      });
      spectator.detectChanges();

      expect(spectator.component.form.controls.path.errors).toBeNull();
      expect(spectator.component.form.valid).toBe(true);
    });

    it('accepts nested dataset paths', () => {
      spectator.component.form.patchValue({
        path: '/mnt/tank/iso/images',
        files: fakeFile('test.iso'),
      });
      spectator.detectChanges();

      expect(spectator.component.form.controls.path.errors).toBeNull();
      expect(spectator.component.form.valid).toBe(true);
    });
  });
});
