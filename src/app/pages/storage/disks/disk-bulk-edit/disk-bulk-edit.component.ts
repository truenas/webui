import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { JobState } from 'app/enums/job-state.enum';
import helptext from 'app/helptext/storage/disks/disks';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { WebSocketService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { StorageService } from 'app/services/storage.service';

@UntilDestroy()
@Component({
  selector: 'app-disk-bulk-edit',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class DiskBulkEditComponent implements FormConfiguration {
  route_success: string[] = ['storage', 'disks'];
  isEntity = true;

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.bulk_edit.title,
      class: 'disks',
      label: true,
      config: [
        {
          type: 'input',
          name: 'disk_name',
          placeholder: helptext.bulk_edit.disks.placeholder,
          tooltip: helptext.bulk_edit.disks.tooltip,
          value: [this.diskBucket.diskNames],
          readonly: true,
        },
      ],
    }, {
      name: helptext.bulk_edit.label,
      class: 'settings',
      label: true,
      config: [
        {
          type: 'input',
          name: 'disk_serial',
          placeholder: helptext.bulk_edit.serial.placeholder,
          tooltip: helptext.bulk_edit.serial.tooltip,
          value: [this.diskBucket.ids],
          readonly: true,
          isHidden: true,
        },
        {
          type: 'select',
          name: 'disk_hddstandby',
          value: this.diskBucket.hddStandby,
          placeholder: helptext.disk_form_hddstandby_placeholder,
          tooltip: helptext.disk_form_hddstandby_tooltip,
          options: helptext.disk_form_hddstandby_options,
        },
        {
          type: 'select',
          name: 'disk_advpowermgmt',
          placeholder: helptext.disk_form_advpowermgmt_placeholder,
          value: this.diskBucket.advPowerMgt,
          tooltip: helptext.disk_form_advpowermgmt_tooltip,
          options: helptext.disk_form_advpowermgmt_options,
        },
        {
          type: 'checkbox',
          name: 'disk_togglesmart',
          placeholder: helptext.disk_form_togglesmart_placeholder,
          value: this.diskBucket.diskToggleStatus,
          tooltip: helptext.disk_form_togglesmart_tooltip,
        },
        {
          type: 'input',
          name: 'disk_smartoptions',
          placeholder: helptext.disk_form_smartoptions_placeholder,
          value: this.diskBucket.SMARToptions,
          tooltip: helptext.disk_form_smartoptions_tooltip,
        },
      ],
    },
  ];

  constructor(
    private _router: Router,
    private dialogService: DialogService,
    protected ws: WebSocketService,
    protected aroute: ActivatedRoute,
    protected loader: AppLoaderService,
    public diskBucket: StorageService,
  ) {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      if (params['poolId']) {
        this.route_success = ['storage', 'pools', 'status', params['poolId']];
      }
    });
  }

  afterInit(): void {
    if (!this.diskBucket.ids) {
      this._router.navigate(this.route_success);
    }
  }

  customSubmit(event: any): void {
    this.loader.open();
    const req = [];
    const data = {
      hddstandby: event.disk_hddstandby,
      advpowermgmt: event.disk_advpowermgmt,
      togglesmart: event.disk_togglesmart,
      smartoptions: event.disk_smartoptions,
    };

    if (!data.togglesmart) {
      data.smartoptions = '';
    }

    for (const i of event.disk_serial[0]) {
      req.push([i, data]);
    }

    this.ws.job('core.bulk', ['disk.update', req])
      .pipe(untilDestroyed(this)).subscribe(
        (res) => {
          if (res.state === JobState.Success) {
            this.loader.close();
            let isSuccessful = true;
            for (const result of res.result) {
              if (result.error != null) {
                this.dialogService.errorReport(helptext.dialog_error, result.error);
                isSuccessful = false;
                break;
              }
            }
            if (isSuccessful) {
              this._router.navigate(this.route_success);
            }
          }
        },
        (err) => {
          this.loader.close();
          this.dialogService.errorReport(helptext.dialog_error, err.reason, err.trace.formatted);
        },
      );
  }
}
