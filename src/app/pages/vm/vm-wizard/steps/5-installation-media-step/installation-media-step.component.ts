import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnDialog, TnStepperNextDirective, TnStepperPreviousDirective,
} from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { stepCompletedSignal } from 'app/helpers/step-completed-signal.helper';
import { helptextVmWizard } from 'app/helptext/vm/vm-wizard/vm-wizard';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { SummaryProvider, SummarySection } from 'app/modules/summary/summary.interface';
import { UploadIsoDialogComponent } from 'app/pages/vm/vm-wizard/upload-iso-dialog/upload-iso-dialog.component';
import { FilesystemService } from 'app/services/filesystem.service';

@Component({
  selector: 'ix-installation-media-step',
  styleUrls: ['./installation-media-step.component.scss'],
  templateUrl: './installation-media-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxExplorerComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    FormActionsComponent,
    TnStepperPreviousDirective,
    TnStepperNextDirective,
    TranslateModule,
  ],
})
export class InstallationMediaStepComponent implements SummaryProvider {
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private filesystemService = inject(FilesystemService);
  private tnDialog = inject(TnDialog);
  private destroyRef = inject(DestroyRef);

  form = this.formBuilder.nonNullable.group({
    iso_path: [''],
  });

  // Drives the stepper's linear gating (replaces mat's [stepControl]).
  readonly completed = stepCompletedSignal(this.form);

  readonly helptext = helptextVmWizard;
  readonly fileNodeProvider = this.filesystemService.getFilesystemNodeProvider();
  protected readonly requiredRoles = [Role.VmWrite];

  onUploadIsoClicked(): void {
    this.tnDialog.open(UploadIsoDialogComponent)
      .closed
      .pipe(takeUntilDestroyed(this.destroyRef))
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
