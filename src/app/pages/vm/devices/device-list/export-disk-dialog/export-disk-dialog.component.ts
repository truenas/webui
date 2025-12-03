import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef,
  MatDialogClose,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { helptextVmWizard } from 'app/helptext/vm/vm-wizard/vm-wizard';
import { VmDiskDevice } from 'app/interfaces/vm-device.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { validateNotPoolRoot } from 'app/modules/forms/ix-forms/validators/validators';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { FilesystemService } from 'app/services/filesystem.service';

export interface ExportDiskDialogData {
  device: VmDiskDevice;
  vmName: string;
}

interface ImageFormat {
  label: string;
  value: string;
  extension: string;
}

@Component({
  selector: 'ix-export-disk-dialog',
  templateUrl: './export-disk-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    ReactiveFormsModule,
    IxExplorerComponent,
    IxInputComponent,
    IxSelectComponent,
    MatDialogActions,
    FormActionsComponent,
    MatButton,
    MatDialogClose,
    TestDirective,
    TranslateModule,
    MatProgressBarModule,
  ],
})
export class ExportDiskDialogComponent {
  private fb = inject(FormBuilder);
  private filesystemService = inject(FilesystemService);
  private translate = inject(TranslateService);
  dialogRef = inject(MatDialogRef) as MatDialogRef<ExportDiskDialogComponent>;
  data = inject<ExportDiskDialogData>(MAT_DIALOG_DATA);

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

  onSubmit(): void {
    const values = this.form.value;
    const selectedFormat = this.imageFormats.find((format) => format.value === values.format);

    // Build the full destination path from directory and filename
    let destinationDir = values.destinationDir?.trim() || '';
    if (!destinationDir.endsWith('/')) {
      destinationDir += '/';
    }

    // Remove any extension from the image name and add the correct one
    const imageNameWithoutExt = (values.imageName || '').replace(/\.[^/.]+$/, '');
    const destinationPath = destinationDir + imageNameWithoutExt + (selectedFormat?.extension || '.qcow2');

    const request = {
      source: this.sourcePath,
      destination: destinationPath,
    };

    // Close the dialog and pass the export info
    this.dialogRef.close({
      request,
      destinationPath,
    });
  }
}
