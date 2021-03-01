import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { T } from '../../../../translate-marker';
import * as _ from 'lodash';
import { StorageService, DialogService, WebSocketService } from '../../../../services';
import { LocaleService } from 'app/services/locale.service';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { DialogFormConfiguration } from '../../../common/entity/entity-dialog/dialog-form-configuration.interface';
import helptext from '../../../../helptext/storage/disks/disks';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector: 'disk-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
})
export class DiskListComponent {
  public title = T("Disks");
  protected queryCall = "disk.query";
  protected queryCallOption = [[], {"extra":{"pools": true}}];
  noAdd = true;

  public columns: Array<any> = [
    { name: T('Name'), prop: 'name', always_display: true },
    { name: T('Serial'), prop: 'serial' },
    { name: T('Disk Size'), prop: 'readable_size' },
    { name: T('Pool'), prop: 'pool' },
    { name: T('Disk Type'), prop: 'type', hidden: true },
    { name: T('Description'), prop: 'description', hidden: true },
    { name: T('Model'), prop: 'model', hidden: true },
    { name: T('Transfer Mode'), prop: 'transfermode', hidden: true },
    { name: T("Rotation Rate (RPM)"), prop: 'rotationrate', hidden: true },
    { name: T('HDD Standby'), prop: 'hddstandby', hidden: true },
    { name: T('Adv. Power Management'), prop: 'advpowermgmt', hidden: true },
    { name: T('Acoustic Level'), prop: 'acousticlevel', hidden: true },
    { name: T('Enable S.M.A.R.T.'), prop: 'togglesmart', hidden: true },
    { name: T('S.M.A.R.T. extra options'), prop: 'smartoptions', hidden: true },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true,
    deleteMsg: {
      title: 'User',
      key_props: ['name']
    },
  };
  public diskIds: Array<any> = [];
  public diskNames: Array<any> = [];
  public hddStandby: Array<any> = [];
  public advPowerMgt: Array<any> = [];
  public acousticLevel: Array<any> = [];
  public diskToggle: boolean;
  public SMARToptions: Array<any> = [];
  private SMARTdiskChoices: any = {};

  public multiActions: Array<any> = [{
    id: "medit",
    label: T("Edit Disk(s)"),
    icon: "edit",
    enable: true,
    ttpos: "above",
    onClick: (selected) => {
      if (selected.length > 1) {
        for (let i of selected) {
          this.diskIds.push(i.identifier);
          this.diskNames.push(i.name);
          this.hddStandby.push(i.hddstandby);
          this.advPowerMgt.push(i.advpowermgmt);
          this.acousticLevel.push(i.acousticlevel);
          if (i.togglesmart === true) {
            this.diskToggle = true;
            this.SMARToptions.push(i.smartoptions);
          }
        }
        this.diskbucket.diskIdsBucket(this.diskIds);
        this.diskbucket.diskNamesBucket(this.diskNames);
        this.diskbucket.diskToggleBucket(this.diskToggle);

        // If all items match in an array, this fills in the value in the form; otherwise, blank
        this.hddStandby.every((val, i, arr) => val === arr[0]) ?
          this.diskbucket.hddStandby = this.hddStandby[0] :
            this.diskbucket.hddStandby = undefined;

          this.advPowerMgt.every((val, i, arr) => val === arr[0]) ?
            this.diskbucket.advPowerMgt = this.advPowerMgt[0] :
              this.diskbucket.advPowerMgt = undefined;

            this.acousticLevel.every((val, i, arr) => val === arr[0]) ?
              this.diskbucket.acousticLevel = this.acousticLevel[0] :
                this.diskbucket.acousticLevel = undefined;

              this.SMARToptions.every((val, i, arr) => val === arr[0]) ?
                this.diskbucket.SMARToptions = this.SMARToptions[0] :
                  this.diskbucket.SMARToptions = undefined;

                this.router.navigate(new Array('/').concat([
                  "storage", "disks", "bulk-edit"
                ]));
      } else {
        this.router.navigate(new Array('/').concat([
          "storage", "disks", "edit", selected[0].identifier
        ]));
      }

    }
  }, {
    id: 'mmanualtest',
    label: T("Manual Test"),
    icon: 'play_arrow',
    enable: true,
    ttpos: "above",
    onClick: (selected) => {
      this.manualTest(selected);
    }
  }]

  protected unused: any;
  constructor(protected ws: WebSocketService, protected router: Router, public diskbucket: StorageService, protected dialogService: DialogService,
    protected localeService: LocaleService, private dialog: MatDialog) {
    this.ws.call('disk.get_unused', []).subscribe((unused_res) => {
      this.unused = unused_res;
    }, err => new EntityUtils().handleWSError(this, err));
    this.ws.call('smart.test.disk_choices').subscribe(res => this.SMARTdiskChoices = res, err => new EntityUtils().handleWSError(this, err))
  }

  getActions(parentRow) {
    const actions = [{
      id: parentRow.name,
      icon: 'edit',
      name: 'edit',
      label: T("Edit"),
      onClick: (row) => {
        this.router.navigate(new Array('/').concat([
          "storage", "disks", "edit", row.identifier
        ]));
      }
    }, {
      id: parentRow.name,
      icon: 'format_list_bulleted',
      name: 'manual_test',
      label: T("Manual Test"),
      onClick: (row) => {
        this.manualTest(row);
      }
    }];

    for(let key in this.SMARTdiskChoices) {
      if(key === parentRow.identifier) {
        actions.push({
          id: parentRow.name,
          icon: 'format_list_bulleted',
          name: 'smartresults',
          label: T("S.M.A.R.T Test Results"),
          onClick: (row) => {
            this.router.navigate(new Array('/').concat([
              "storage", "disks", "smartresults", row.name
            ]));
          }
        });
        break;
      }
    }

    const devMatch = this.unused.filter((dev) => dev.name == parentRow.name);
    if (devMatch.length > 0) {
      actions.push({
        id: parentRow.name,
        icon: 'delete_sweep',
        name: 'wipe',
        label: T("Wipe"),
        onClick: (row) => {
          const self = this;
          const conf: DialogFormConfiguration = {
            title: helptext.diskWipeDialogForm.title + row.name,
            fieldConfig: [
              {
                type: 'input',
                name: 'disk_name',
                placeholder: helptext.dw_disk_name_placeholder,
                tooltip: helptext.dw_disk_name_tooltip,
                readonly: true
              },
              {
                type: 'select',
                name: 'wipe_method',
                placeholder: helptext.dw_wipe_method_placeholder,
                tooltip: helptext.dw_wipe_method_tooltip,
                options: [
                  {
                    label: T('Quick'),
                    value: 'QUICK',
                  }, {
                    label: T('Full with zeros'),
                    value: 'FULL',
                  }, {
                    label: T('Full with random data'),
                    value: 'FULL_RANDOM',
                  }
                ],
                value: 'QUICK',
              }
            ],
            saveButtonText: helptext.diskWipeDialogForm.saveButtonText,
            afterInit: function (entityDialogForm) {
              entityDialogForm.formGroup.controls['disk_name'].setValue(row.name);
            },
            customSubmit: function (entityDialogForm) {
              self.dialogService.confirm(
                helptext.diskWipeDialogForm.title + row.name,
                helptext.diskWipeDialogForm.confirmContent).subscribe((res) => {
                  if (res) {
                    const dialogRef = self.dialog.open(EntityJobComponent, { data: { "title": helptext.diskWipeDialogForm.title + row.name } });
                    dialogRef.componentInstance.setDescription(helptext.diskWipeDialogForm.startDescription);
                    dialogRef.componentInstance.setCall('disk.wipe', [entityDialogForm.formValue.disk_name, entityDialogForm.formValue.wipe_method]);
                    dialogRef.componentInstance.submit();

                    dialogRef.componentInstance.success.subscribe((wipeRes) => {
                      if (dialogRef.componentInstance) {
                        dialogRef.close(true);
                        self.dialogService.generalDialog({
                          title: helptext.diskWipeDialogForm.title + row.name,
                          message: helptext.diskWipeDialogForm.infoContent,
                          hideCancel: true,
                        });
                      }
                    });
                    dialogRef.componentInstance.failure.subscribe((wipeRes) => {
                      dialogRef.componentInstance.setDescription(wipeRes.error);
                    });
                    entityDialogForm.dialogRef.close(true);
                  }
                });
            }
          }
          this.dialogService.dialogForm(conf);
        }
      })
    }
    return actions;
  }

  dataHandler(entityList: any) {
    this.diskUpdate(entityList);
  }

  diskUpdate(entityList: any) {
    for (const disk of entityList.rows) {
      disk.readable_size = (<any>window).filesize(disk.size, { standard: 'iec' });
    }
  }

  afterInit(entityList) {
    this.ws.subscribe('disk.query').subscribe((res) => {
      if (res) {
        entityList.needTableResize = false;
        entityList.getData();
      }
    })
  }

  resourceTransformIncomingRestData(data) {
    data.forEach(i => i.pool = i.pool ? i.pool : 'N/A');
    return data;
  }

  manualTest(selected) {
    const parent = this;
    const disks = Array.isArray(selected) ? selected.map(item => item.name) : [selected.name];
    const disksIdentifier = Array.isArray(selected) ? selected.map(item => {
      return { 'identifier': item.identifier }
    }) : [{ 'identifier': selected.identifier }];
    const conf: DialogFormConfiguration = {
      title: helptext.manual_test_dialog.title,
      fieldConfig: [
        {
          type: 'input',
          name: 'disks',
          placeholder: helptext.manual_test_dialog.disk_placeholder,
          value: disks,
          readonly: true,
        },
        {
          type: 'select',
          name: 'type',
          placeholder: helptext.manual_test_dialog.type_placeholder,
          options: [
            {
              label: 'LONG',
              value: 'LONG',
            },
            {
              label: 'SHORT',
              value: 'SHORT',
            },
            {
              label: 'CONVEYANCE',
              value: 'CONVEYANCE',
            },
            {
              label: 'OFFLINE',
              value: 'OFFLINE',
            }
          ],
          value: 'LONG',
        }
      ],
      saveButtonText: helptext.manual_test_dialog.saveButtonText,
      customSubmit: function (entityDialog) {
        disksIdentifier.forEach(item => {
          item['type'] = entityDialog.formValue.type;
        });

        parent.ws.call('smart.test.manual_test', [disksIdentifier]).subscribe(
          res => {
            entityDialog.dialogRef.close(true);
            parent.generateManualTestSummary(res);
          },
          err => {
            new EntityUtils().handleWSError(parent, err, parent.dialogService, conf.fieldConfig);
          }
        )
      }
    }
    this.dialogService.dialogForm(conf);
  }

  generateManualTestSummary(res) {
    let success_note = '<h4>Expected Finished Time:</h4>';
    let hasSuccessNote = false;
    let fail_note = '<h4>Errors:</h4>';
    let hasFailNote = false;

    for (let i = 0; i < res.length; i++) {
      if (res[i].expected_result_time) {
        hasSuccessNote = true;
        success_note += `<b>${res[i].disk}</b>: ${this.localeService.formatDateTime(res[i].expected_result_time.$date)}<br>`
      } else if (res[i].error) {
        hasFailNote = true;
        fail_note += `<b>${res[i].disk}</b><br>${res[i].error}<br>`;
      }
    }
    this.dialogService.Info(
      T('Manual Test Summary'),
      (hasSuccessNote ? success_note + '<br>' : '') + (hasFailNote ? fail_note : ''),
      '600px',
      'info',
      true);
  }
}
