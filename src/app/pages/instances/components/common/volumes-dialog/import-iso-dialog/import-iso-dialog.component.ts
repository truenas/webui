import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { FilesystemService } from 'app/services/filesystem.service';

@Component({
  selector: 'ix-import-iso-dialog',
  templateUrl: './import-iso-dialog.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogContent,
    IxExplorerComponent,
    TranslateModule,
    MatDialogTitle,
    ReactiveFormsModule,
    MatButton,
    MatDialogActions,
    TestDirective,
  ],
})
export class IxImportIsoDialogComponent {
  protected importIsoPath = new FormControl(
    '',
    [
      Validators.required,
      this.validatorsService.withMessage(
        Validators.pattern('.*\\.iso$'),
        this.translate.instant('Must select an ISO file'),
      ),
    ],
  );

  protected readonly treeNodeProvider = this.fileSystem.getFilesystemNodeProvider({
    datasetsOnly: true,
    directoriesOnly: false,
    showHiddenFiles: true,
  });

  constructor(
    private fileSystem: FilesystemService,
    private translate: TranslateService,
    private matDialogRef: MatDialogRef<IxImportIsoDialogComponent>,
    private validatorsService: IxValidatorsService,
  ) {}

  protected submit(): void {
    this.matDialogRef.close(this.importIsoPath.value);
  }
}
