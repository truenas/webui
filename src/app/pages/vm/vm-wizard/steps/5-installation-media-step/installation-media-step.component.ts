import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import helptext from 'app/helptext/vm/vm-wizard/vm-wizard';
import { SummaryProvider, SummarySection } from 'app/modules/common/summary/summary.interface';
import { UploadIsoDialogComponent } from 'app/pages/vm/vm-wizard/upload-iso-dialog/upload-iso-dialog.component';
import { FilesystemService } from 'app/services/filesystem.service';

@UntilDestroy()
@Component({
  selector: 'ix-installation-media-step',
  styleUrls: ['./installation-media-step.component.scss'],
  templateUrl: './installation-media-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstallationMediaStepComponent implements SummaryProvider {
  form = this.formBuilder.group({
    iso_path: [''],
  });

  readonly helptext = helptext;
  readonly fileNodeProvider = this.filesystemService.getFilesystemNodeProvider();

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private filesystemService: FilesystemService,
    private matDialog: MatDialog,
  ) {}

  onUploadIsoClicked(): void {
    this.matDialog.open(UploadIsoDialogComponent)
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((newIsoPath: string | null) => {
        if (!newIsoPath) {
          return;
        }

        this.form.patchValue({
          iso_path: newIsoPath,
        });
      });
  }

  getSummary(): SummarySection {
    if (!this.form.value.iso_path) {
      return [];
    }

    return [
      {
        label: this.translate.instant('Installation Media'),
        value: this.form.value.iso_path,
      },
    ];
  }
}
