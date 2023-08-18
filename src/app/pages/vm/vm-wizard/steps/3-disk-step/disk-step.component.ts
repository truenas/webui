import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import { of } from 'rxjs';
import { DatasetType } from 'app/enums/dataset.enum';
import { VmDiskMode, vmDiskModeLabels } from 'app/enums/vm.enum';
import { choicesToOptions, singleArrayToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/vm/vm-wizard/vm-wizard';
import { SummaryProvider, SummarySection } from 'app/modules/common/summary/summary.interface';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { FreeSpaceValidatorService } from 'app/pages/vm/utils/free-space-validator.service';
import { WebSocketService } from 'app/services/ws.service';

export enum NewOrExistingDisk {
  New = 'new',
  Existing = 'existing',
}

@UntilDestroy()
@Component({
  selector: 'ix-disk-step',
  templateUrl: './disk-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskStepComponent implements OnInit, SummaryProvider {
  form = this.formBuilder.group({
    newOrExisting: [NewOrExistingDisk.New],
    hdd_type: [VmDiskMode.Ahci],
    datastore: [''],
    volsize: [null as number],
    hdd_path: [''],
  }, {
    asyncValidators: [this.freeSpaceValidator.validate],
  });

  readonly hddTypeOptions$ = of(mapToOptions(vmDiskModeLabels, this.translate));
  readonly newOrExistingOptions$ = of([
    {
      label: this.translate.instant('Create new disk image'),
      value: NewOrExistingDisk.New,
      tooltip: helptext.disk_radio_tooltip,
    },
    {
      label: this.translate.instant('Use existing disk image'),
      value: NewOrExistingDisk.Existing,
    },
  ]);
  readonly hddPathOptions$ = this.ws.call('vm.device.disk_choices').pipe(choicesToOptions());

  readonly datastoreOptions$ = this.ws
    .call('pool.filesystem_choices', [[DatasetType.Filesystem]])
    .pipe(singleArrayToOptions());

  readonly helptext = helptext;

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private ws: WebSocketService,
    private freeSpaceValidator: FreeSpaceValidatorService,
    public formatter: IxFormatterService,
  ) { }

  get isCreatingNewDisk(): boolean {
    return this.form.controls.newOrExisting.value === NewOrExistingDisk.New;
  }

  ngOnInit(): void {
    this.form.controls.newOrExisting
      .valueChanges.pipe(untilDestroyed(this))
      .subscribe(() => this.setConditionalValidators());

    this.setConditionalValidators();
  }

  getSummary(): SummarySection {
    const values = this.form.value;
    let diskDescription: string;
    if (this.isCreatingNewDisk) {
      diskDescription = this.translate.instant('{size} {type} at {location}', {
        size: filesize(values.volsize, { standard: 'iec' }),
        type: values.hdd_type,
        location: values.datastore,
      });
    } else {
      diskDescription = this.translate.instant('{type} at {location}', {
        type: values.hdd_type,
        location: values.hdd_path,
      });
    }

    return [
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

    this.form.controls.datastore.updateValueAndValidity();
    this.form.controls.volsize.updateValueAndValidity();
    this.form.controls.hdd_path.updateValueAndValidity();
  }
}
