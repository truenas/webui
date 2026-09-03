import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnBannerComponent, TnButtonComponent, TnDialogShellComponent, TnFormFieldComponent,
  TnFormSectionComponent, TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { helptextVmWizard } from 'app/helptext/vm/vm-wizard/vm-wizard';
import { VmDiskDevice } from 'app/interfaces/vm-device.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult, ixFormMinSubmitFeedbackMs,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { validateNotPoolRoot } from 'app/modules/forms/ix-forms/validators/validators';
import { FilesystemService } from 'app/services/filesystem.service';

export interface ExportDiskDialogData {
  device: VmDiskDevice;
  vmName: string;
}

/**
 * What the dialog closes with. The conversion job itself is started by the opener
 * (`device-list`), which owns the job dialog and its reporting — this form only assembles the
 * request.
 */
export interface ExportDiskDialogResult {
  request: { source: string; destination: string };
  destinationPath: string;
}

interface ImageFormat {
  label: string;
  value: string;
  extension: string;
}

interface ExportDiskFormValue {
  destinationDir: string;
  imageName: string;
  format: string;
}

@Component({
  selector: 'ix-export-disk-dialog',
  templateUrl: './export-disk-dialog.component.html',
  styleUrls: ['./export-disk-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [
    // The submit-feedback hold exists so a `<tn-side-panel>`'s progress bar is perceptible on a
    // fast save. This form issues no request at all (it hands the export back to its opener), so
    // holding here would only delay the close.
    { provide: ixFormMinSubmitFeedbackMs, useValue: 0 },
  ],
  imports: [
    AsyncPipe,
    TnDialogShellComponent,
    TnBannerComponent,
    ReactiveFormsModule,
    IxFormComponent,
    IxExplorerComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
    FormActionsComponent,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class ExportDiskDialogComponent {
  private fb = inject(FormBuilder);
  private filesystemService = inject(FilesystemService);
  private translate = inject(TranslateService);
  dialogRef = inject(DialogRef) as DialogRef<unknown, ExportDiskDialogComponent>;
  data = inject<ExportDiskDialogData>(DIALOG_DATA);

  /**
   * The shared form wrapper owns validity tracking and the submit lifecycle; the dialog only
   * re-exposes its Save surface to the `tnDialogAction` footer.
   */
  private readonly ixForm = viewChild(IxFormComponent);

  readonly helptext = helptextVmWizard;
  readonly imageFormats: ImageFormat[] = [
    { label: 'QCOW2 - QEMU Copy On Write', value: 'qcow2', extension: '.qcow2' },
    { label: 'QED - QEMU Enhanced Disk', value: 'qed', extension: '.qed' },
    { label: 'RAW - Raw Disk Image', value: 'raw', extension: '.raw' },
    { label: 'VDI - VirtualBox Disk Image', value: 'vdi', extension: '.vdi' },
    { label: 'VHDX - Hyper-V Virtual Hard Disk', value: 'vhdx', extension: '.vhdx' },
    { label: 'VMDK - VMware Virtual Machine Disk', value: 'vmdk', extension: '.vmdk' },
  ];

  readonly formatOptions$ = of(this.imageFormats.map((format) => ({
    label: format.label,
    value: format.value,
  })));

  form = this.fb.group({
    destinationDir: ['', [
      Validators.required,
      validateNotPoolRoot(this.translate.instant(this.helptext.export_disk_pool_root_error)),
    ]],
    imageName: [this.generateDefaultImageName(), [Validators.required]],
    format: ['qcow2', [Validators.required]],
  });

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({
    directoriesOnly: true,
  });

  get sourcePath(): string {
    return this.data.device.attributes.path;
  }

  private generateDefaultImageName(): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const vmName = this.data.vmName.replace(/[^a-zA-Z0-9-_]/g, '_');
    return `${vmName}_disk_${timestamp}`;
  }

  protected canSubmit(): boolean {
    return this.ixForm()?.canSubmit() ?? false;
  }

  protected submit(): void {
    this.ixForm()?.submit();
  }

  protected handleSubmit = (
    event: FormSubmitEvent<ExportDiskFormValue>,
  ): SubmitResult<ExportDiskDialogResult, ExportDiskDialogResult> => {
    const values = event.allValues;
    const selectedFormat = this.imageFormats.find((format) => format.value === values.format);

    // Build the full destination path from directory and filename
    let destinationDir = values.destinationDir?.trim() || '';
    if (!destinationDir.endsWith('/')) {
      destinationDir += '/';
    }

    // Remove any extension from the image name and add the correct one
    const imageNameWithoutExt = (values.imageName || '').replace(/\.[^/.]+$/, '');
    const destinationPath = destinationDir + imageNameWithoutExt + (selectedFormat?.extension || '.qcow2');

    const result: ExportDiskDialogResult = {
      request: {
        source: this.sourcePath,
        destination: destinationPath,
      },
      destinationPath,
    };

    return {
      // Nothing is sent from here: the dialog closes with the request and the opener runs the
      // `vm.device.convert` job, so the wrapper's lifecycle only has to report validity and close.
      request$: of(result),
      // The opener's job dialog reports the outcome; a snackbar here would announce a completed
      // export before the export has started.
      successMessage: () => null,
      closeWith: (exportRequest) => exportRequest,
    };
  };
}
