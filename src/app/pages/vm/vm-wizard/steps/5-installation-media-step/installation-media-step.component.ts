import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextVmWizard } from 'app/helptext/vm/vm-wizard/vm-wizard';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { SummaryProvider, SummarySection } from 'app/modules/summary/summary.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { UploadIsoDialogComponent } from 'app/pages/vm/vm-wizard/upload-iso-dialog/upload-iso-dialog.component';
import { FilesystemService } from 'app/services/filesystem.service';

@UntilDestroy()
@Component({
  selector: 'ix-installation-media-step',
  styleUrls: ['./installation-media-step.component.scss'],
  templateUrl: './installation-media-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxExplorerComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    FormActionsComponent,
    MatStepperPrevious,
    MatStepperNext,
    TranslateModule,
  ],
})
export class InstallationMediaStepComponent implements SummaryProvider {
  form = this.formBuilder.group({
    iso_path: [''],
  });

  readonly helptext = helptextVmWizard;
  readonly fileNodeProvider = this.filesystemService.getFilesystemNodeProvider();
  protected readonly requiredRoles = [Role.VmWrite];

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
