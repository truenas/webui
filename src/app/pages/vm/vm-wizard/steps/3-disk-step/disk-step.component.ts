import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { DatasetType } from 'app/enums/dataset.enum';
import { VmDiskMode, vmDiskModeLabels } from 'app/enums/vm.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { choicesToOptions, singleArrayToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextVmWizard } from 'app/helptext/vm/vm-wizard/vm-wizard';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { SummaryProvider, SummarySection } from 'app/modules/summary/summary.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { FreeSpaceValidatorService } from 'app/pages/vm/utils/free-space-validator.service';
import { FilesystemService } from 'app/services/filesystem.service';

export enum NewOrExistingDisk {
  New = 'new',
  Existing = 'existing',
}

const validImageExtensions = ['.qcow2', '.qed', '.raw', '.vdi', '.vhdx', '.vmdk'];

function imageFileValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const value = control.value.toLowerCase();
    const hasValidExtension = validImageExtensions.some((ext) => value.endsWith(ext));

    if (!hasValidExtension) {
      return {
        invalidImageFormat: {
          message: `File must be one of the following formats: ${validImageExtensions.join(', ')}`,
        },
      };
    }

    return null;
  };
}

@UntilDestroy()
@Component({
  selector: 'ix-disk-step',
  templateUrl: './disk-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxCheckboxComponent,
    IxExplorerComponent,
    IxRadioGroupComponent,
    IxSelectComponent,
    IxInputComponent,
    FormActionsComponent,
    MatButton,
    MatStepperPrevious,
    TestDirective,
    MatStepperNext,
    TranslateModule,
  ],
})
export class DiskStepComponent implements OnInit, SummaryProvider {
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private freeSpaceValidator = inject(FreeSpaceValidatorService);
  private filesystemService = inject(FilesystemService);
  formatter = inject(IxFormatterService);

  form = this.formBuilder.group({
    newOrExisting: [NewOrExistingDisk.New],
    hdd_type: [VmDiskMode.Ahci],
    datastore: [''],
    volsize: [null as number | null],
    hdd_path: [''],
    import_image: [false],
    image_source: [''],
  }, {
    asyncValidators: [this.freeSpaceValidator.validate],
  });

  readonly hddTypeOptions$ = of(mapToOptions(vmDiskModeLabels, this.translate));
  readonly newOrExistingOptions$ = of([
    {
      label: this.translate.instant('Create new disk image'),
      value: NewOrExistingDisk.New,
      tooltip: helptextVmWizard.disk_radio_tooltip,
    },
    {
      label: this.translate.instant('Use existing disk image'),
      value: NewOrExistingDisk.Existing,
    },
  ]);

  readonly hddPathOptions$ = this.api.call('vm.device.disk_choices').pipe(choicesToOptions());

  readonly datastoreOptions$ = this.api
    .call('pool.filesystem_choices', [[DatasetType.Filesystem]])
    .pipe(singleArrayToOptions());

  readonly helptext = helptextVmWizard;
  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({
    directoriesOnly: false,
    showHiddenFiles: false,
  });

  get isCreatingNewDisk(): boolean {
    return this.form.controls.newOrExisting.value === NewOrExistingDisk.New;
  }

  get isImportingImage(): boolean {
    return this.form.controls.import_image.value;
  }

  ngOnInit(): void {
    this.form.controls.newOrExisting
      .valueChanges.pipe(untilDestroyed(this))
      .subscribe(() => this.setConditionalValidators());

    this.form.controls.import_image
      .valueChanges.pipe(untilDestroyed(this))
      .subscribe(() => this.setConditionalValidators());

    this.setConditionalValidators();
  }

  getSummary(): SummarySection {
    const values = this.form.value;
    let diskDescription: string;
    if (this.isCreatingNewDisk) {
      diskDescription = this.translate.instant('{size} {type} at {location}', {
        size: buildNormalizedFileSize(values.volsize || 0),
        type: values.hdd_type,
        location: values.datastore,
      });
    } else {
      diskDescription = this.translate.instant('{type} at {location}', {
        type: values.hdd_type,
        location: values.hdd_path,
      });
    }

    const summary: SummarySection = [
      {
        label: this.translate.instant('Disk'),
        value: this.isCreatingNewDisk
          ? this.translate.instant('Create new disk image')
          : this.translate.instant('Use existing disk image'),
      },
      {
        label: this.translate.instant('Disk Description'),
        value: diskDescription,
      },
    ];

    if (this.isImportingImage) {
      summary.push({
        label: this.translate.instant('Import Image'),
        value: this.translate.instant('Yes, from {source}', { source: values.image_source }),
      });
    }

    return summary;
  }

  private setConditionalValidators(): void {
    if (this.isCreatingNewDisk) {
      this.form.controls.datastore.setValidators(Validators.required);
      this.form.controls.volsize.setValidators(Validators.required);
      this.form.controls.hdd_path.clearValidators();
    } else {
      this.form.controls.datastore.clearValidators();
      this.form.controls.volsize.clearValidators();
      this.form.controls.hdd_path.setValidators(Validators.required);
    }

    if (this.isImportingImage) {
      this.form.controls.image_source.setValidators([Validators.required, imageFileValidator()]);
    } else {
      this.form.controls.image_source.clearValidators();
    }

    this.form.controls.datastore.updateValueAndValidity();
    this.form.controls.volsize.updateValueAndValidity();
    this.form.controls.hdd_path.updateValueAndValidity();
    this.form.controls.image_source.updateValueAndValidity();
  }
}
