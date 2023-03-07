import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { mntPath } from 'app/enums/mnt-path.enum';
import helptext from 'app/helptext/vm/vm-wizard/vm-wizard';
import { SummaryProvider, SummarySection } from 'app/modules/common/summary/summary.interface';
import { FilesystemService } from 'app/services/filesystem.service';

@Component({
  selector: 'ix-installation-media-step',
  templateUrl: './installation-media-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstallationMediaStepComponent implements SummaryProvider {
  // TODO: Currently uploading an ISO file silently changes iso_path.
  // TODO: Consider changing UI.
  form = this.formBuilder.group({
    iso_path: [mntPath],
    upload_iso: [false],
    upload_iso_path: [mntPath],
    upload_iso_file: [null],
  });

  readonly helptext = helptext;
  readonly fileNodeProvider = this.filesystemService.getFilesystemNodeProvider();
  readonly directoryNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });

  constructor(
    private formBuilder: FormBuilder,
    private filesystemService: FilesystemService,
  ) {}

  getSummary(): SummarySection {
    return [];
  }
}
