import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { JobState } from 'app/enums/job-state.enum';
import helptext from 'app/helptext/storage/disks/disks';
import { Option } from 'app/interfaces/option.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { WebSocketService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: 'disk-bulk-edit.component.html',
  styleUrls: ['disk-bulk-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskBulkEditComponent {
  diskIds: string[] = [];
  diskNames: string[] = [];
  isLoading = false;
  form = this.fb.group({
    hddstandby: [null as DiskStandby],
    advpowermgmt: [null as DiskPowerLevel],
    togglesmart: [false],
    smartoptions: [''],
  });
  readonly helptext = helptext;
  readonly helptextBulkEdit = helptext.bulk_edit;
  readonly hddstandbyOptions$ = of(helptext.disk_form_hddstandby_options);
  readonly advpowermgmtOptions$ = of(this.translateOptions(this.helptext.disk_form_advpowermgmt_options));

  constructor(
    private fb: FormBuilder,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
  ) {}

  private translateOptions(options: Option[]): Option[] {
    return options.map((option) => {
      return { label: this.translate.instant(option.label), value: option.value };
    });
  }

  setFormDiskBulk(selectedDisks: Disk[]): void {
    const setForm: DiskBulkEditComponent['form']['value'] = {
      hddstandby: '' as DiskStandby,
      advpowermgmt: '' as DiskPowerLevel,
      togglesmart: false,
      smartoptions: '',
    };
    const hddStandby: DiskStandby[] = [];
    const advPowerMgt: DiskPowerLevel[] = [];
    const smartOptions: string[] = [];

    for (const disk of selectedDisks) {
      this.diskIds.push(disk.identifier);
      this.diskNames.push(disk.name);
      hddStandby.push(disk.hddstandby);
      advPowerMgt.push(disk.advpowermgmt);
      if (disk.togglesmart) {
        setForm.togglesmart = true;
        smartOptions.push(disk.smartoptions);
      }
    }

    // If all items match in an array, this fills in the value in the form; otherwise, blank
    if (hddStandby.every((val, i, arr) => val === arr[0])) {
      setForm.hddstandby = hddStandby[0] || null;
    } else {
      setForm.hddstandby = null;
    }

    if (advPowerMgt.every((val, i, arr) => val === arr[0])) {
      setForm.advpowermgmt = advPowerMgt[0] || null;
    } else {
      setForm.advpowermgmt = null;
    }

    if (smartOptions.every((val, i, arr) => val === arr[0])) {
      setForm.smartoptions = smartOptions[0] || null;
    } else {
      setForm.smartoptions = null;
    }

    this.form.patchValue({ ...setForm });
  }

  prepareDataSubmit(): any[][] {
    const req = [];
    const data: { [key: string]: any } = { ...this.form.value };

    if (!data.togglesmart) {
      data.smartoptions = '';
    }

    for (const key in data) {
      if (data[key] === null) {
        delete data[key];
      }
    }

    for (const i of this.diskIds) {
      req.push([i, data]);
    }

    return req;
  }

  onSubmit(): void {
    const req = this.prepareDataSubmit();

    this.isLoading = true;
    this.ws.job('core.bulk', ['disk.update', req])
      .pipe(untilDestroyed(this)).subscribe(
        (res) => {
          if (res.state === JobState.Success) {
            this.isLoading = false;
            let isSuccessful = true;
            for (const result of res.result) {
              if (result.error !== null) {
                this.slideInService.close();
                this.dialogService.errorReport(helptext.dialog_error, result.error);
                isSuccessful = false;
                break;
              }
            }
            if (isSuccessful) {
              this.slideInService.close();
              this.dialogService.info(helptext.dialog_title,
                helptext.dialog_msg_save_success, true);
            }
          }
        },
        (err) => {
          this.isLoading = false;
          this.slideInService.close();
          this.dialogService.errorReport(helptext.dialog_error, err.reason, err.trace.formatted);
        },
      );
  }
}
