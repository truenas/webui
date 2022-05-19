import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { JobState } from 'app/enums/job-state.enum';
import helptext from 'app/helptext/storage/disks/disks';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Option } from 'app/interfaces/option.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';
import { WebSocketService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { StorageService } from 'app/services/storage.service';

@UntilDestroy()
@Component({
  templateUrl: 'disk-bulk-edit.component.html',
  styleUrls: ['disk-bulk-edit.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskBulkEditComponent implements FormConfiguration {
  routeSuccess: string[] = ['storage', 'disks'];
  // isEntity = true;
  // ------------------------------------------------
  diskIds: string[] = [];
  diskNames: string[] = [];
  isLoading = false;
  title = '';
  diskName: any; // any
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
    private router: Router,
    private dialogService: DialogService,
    protected ws: WebSocketService,
    protected aroute: ActivatedRoute,
    protected loader: AppLoaderService,
    public diskBucket: StorageService,
    private translate: TranslateService,
  ) {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => { // --------------
      if (params['poolId']) {
        this.routeSuccess = ['storage', 'pools', 'status', params['poolId']];
      }
    });
  }

  afterInit(): void { // --------------
    if (!this.diskBucket.ids) {
      this.router.navigate(this.routeSuccess);
    }
  }

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

    for (const i of selectedDisks) {
      this.diskIds.push(i.identifier);
      this.diskNames.push(i.name);
      hddStandby.push(i.hddstandby);
      advPowerMgt.push(i.advpowermgmt);
      if (i.togglesmart) {
        setForm.togglesmart = true;
        smartOptions.push(i.smartoptions);
      }
    }

    // If all items match in an array, this fills in the value in the form; otherwise, blank
    if (hddStandby.every((val, i, arr) => val === arr[0])) {
      setForm.hddstandby = hddStandby[0];
    } else {
      setForm.hddstandby = undefined;
    }

    if (advPowerMgt.every((val, i, arr) => val === arr[0])) {
      setForm.advpowermgmt = advPowerMgt[0];
    } else {
      setForm.advpowermgmt = undefined;
    }

    if (smartOptions.every((val, i, arr) => val === arr[0])) {
      setForm.smartoptions = smartOptions[0];
    } else {
      setForm.smartoptions = '';
    }

    this.form.patchValue({ ...setForm });
  }

  onSubmit(): void {
    const req = [];
    const data = { ...this.form.value };

    if (!data.togglesmart) {
      data.smartoptions = '';
    }

    for (const i of this.diskIds) {
      req.push([i, data]);
    }

    this.ws.job('core.bulk', ['disk.update', req])
      .pipe(untilDestroyed(this)).subscribe(
        (res) => {
          if (res.state === JobState.Success) {
            // this.loader.close();
            let isSuccessful = true;
            for (const result of res.result) {
              if (result.error !== null) {
                this.dialogService.errorReport(helptext.dialog_error, result.error);
                isSuccessful = false;
                break;
              }
            }
            if (isSuccessful) {
              this.router.navigate(this.routeSuccess);
            }
          }
        },
        (err) => {
          // this.loader.close();
          this.dialogService.errorReport(helptext.dialog_error, err.reason, err.trace.formatted);
        },
      );
  }
}
