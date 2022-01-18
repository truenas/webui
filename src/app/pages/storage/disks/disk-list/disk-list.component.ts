import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TooltipPosition } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as filesize from 'filesize';
import { filter } from 'rxjs/operators';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { DiskWipeMethod } from 'app/enums/disk-wipe-method.enum';
import { SmartTestType } from 'app/enums/smart-test-type.enum';
import helptext from 'app/helptext/storage/disks/disks';
import { Choices } from 'app/interfaces/choices.interface';
import { CoreEvent } from 'app/interfaces/events';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { ManualSmartTest, SmartManualTestParams } from 'app/interfaces/smart-test.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService, StorageService, WebSocketService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { LocaleService } from 'app/services/locale.service';

@UntilDestroy()
@Component({
  selector: 'disk-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class DiskListComponent implements EntityTableConfig<Disk> {
  title = this.translate.instant('Disks');
  queryCall = 'disk.query' as const;
  queryCallOption: QueryParams<Disk, { extra: { pools: true } }> = [[], { extra: { pools: true } }];
  noAdd = true;

  columns = [
    { name: this.translate.instant('Name'), prop: 'name', always_display: true },
    { name: this.translate.instant('Serial'), prop: 'serial' },
    { name: this.translate.instant('Disk Size'), prop: 'readable_size' },
    { name: this.translate.instant('Pool'), prop: 'pool' },
    { name: this.translate.instant('Disk Type'), prop: 'type', hidden: true },
    { name: this.translate.instant('Description'), prop: 'description', hidden: true },
    { name: this.translate.instant('Model'), prop: 'model', hidden: true },
    { name: this.translate.instant('Transfer Mode'), prop: 'transfermode', hidden: true },
    { name: this.translate.instant('Rotation Rate (RPM)'), prop: 'rotationrate', hidden: true },
    { name: this.translate.instant('HDD Standby'), prop: 'hddstandby', hidden: true },
    { name: this.translate.instant('Adv. Power Management'), prop: 'advpowermgmt', hidden: true },
    { name: this.translate.instant('Enable S.M.A.R.T.'), prop: 'togglesmart', hidden: true },
    { name: this.translate.instant('S.M.A.R.T. extra options'), prop: 'smartoptions', hidden: true },
  ];
  config = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true,
    deleteMsg: {
      title: 'User',
      key_props: ['name'],
    },
  };
  diskIds: string[] = [];
  diskNames: string[] = [];
  hddStandby: DiskStandby[] = [];
  advPowerMgt: DiskPowerLevel[] = [];
  diskToggle: boolean;
  SMARToptions: string[] = [];
  private SMARTdiskChoices: Choices = {};

  multiActions = [{
    id: 'medit',
    label: this.translate.instant('Edit Disk(s)'),
    icon: 'edit',
    enable: true,
    ttpos: 'above' as TooltipPosition,
    onClick: (selected: Disk[]) => {
      if (selected.length > 1) {
        for (const i of selected) {
          this.diskIds.push(i.identifier);
          this.diskNames.push(i.name);
          this.hddStandby.push(i.hddstandby);
          this.advPowerMgt.push(i.advpowermgmt);
          if (i.togglesmart) {
            this.diskToggle = true;
            this.SMARToptions.push(i.smartoptions);
          }
        }
        this.diskbucket.diskIdsBucket(this.diskIds);
        this.diskbucket.diskNamesBucket(this.diskNames);
        this.diskbucket.diskToggleBucket(this.diskToggle);

        // If all items match in an array, this fills in the value in the form; otherwise, blank
        if (this.hddStandby.every((val, i, arr) => val === arr[0])) {
          this.diskbucket.hddStandby = this.hddStandby[0];
        } else {
          this.diskbucket.hddStandby = undefined;
        }

        if (this.advPowerMgt.every((val, i, arr) => val === arr[0])) {
          this.diskbucket.advPowerMgt = this.advPowerMgt[0];
        } else {
          this.diskbucket.advPowerMgt = undefined;
        }

        if (this.SMARToptions.every((val, i, arr) => val === arr[0])) {
          this.diskbucket.SMARToptions = this.SMARToptions[0];
        } else {
          this.diskbucket.SMARToptions = undefined;
        }

        this.router.navigate(['/', 'storage', 'disks', 'bulk-edit']);
      } else {
        this.router.navigate(['/', 'storage', 'disks', 'edit', selected[0].identifier]);
      }
    },
  }, {
    id: 'mmanualtest',
    label: this.translate.instant('Manual Test'),
    icon: 'play_arrow',
    enable: true,
    ttpos: 'above' as TooltipPosition,
    onClick: (selected: Disk[]) => {
      this.manualTest(selected);
    },
  }];

  protected unused: Disk[] = [];
  constructor(
    protected ws: WebSocketService,
    protected router: Router,
    public diskbucket: StorageService,
    protected dialogService: DialogService,
    protected localeService: LocaleService,
    private dialog: MatDialog,
    private core: CoreService,
    protected translate: TranslateService,
  ) {}

  getActions(parentRow: Disk): EntityTableAction[] {
    const actions = [{
      id: parentRow.name,
      icon: 'edit',
      name: 'edit',
      label: this.translate.instant('Edit'),
      onClick: (row: Disk) => {
        this.router.navigate(['/', 'storage', 'disks', 'edit', row.identifier]);
      },
    }];

    for (const key in this.SMARTdiskChoices) {
      if (key === parentRow.identifier) {
        actions.push({
          id: parentRow.name,
          icon: 'format_list_bulleted',
          name: 'manual_test',
          label: this.translate.instant('Manual Test'),
          onClick: (row: Disk) => {
            this.manualTest(row);
          },
        });
        actions.push({
          id: parentRow.name,
          icon: 'format_list_bulleted',
          name: 'smartresults',
          label: this.translate.instant('S.M.A.R.T Test Results'),
          onClick: (row) => {
            this.router.navigate(['/', 'storage', 'disks', 'smartresults', row.name]);
          },
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
        label: this.translate.instant('Wipe'),
        onClick: (row) => {
          const conf: DialogFormConfiguration = {
            title: helptext.diskWipeDialogForm.title + row.name,
            fieldConfig: [
              {
                type: 'input',
                name: 'disk_name',
                placeholder: helptext.dw_disk_name_placeholder,
                tooltip: helptext.dw_disk_name_tooltip,
                readonly: true,
              },
              {
                type: 'select',
                name: 'wipe_method',
                placeholder: helptext.dw_wipe_method_placeholder,
                tooltip: helptext.dw_wipe_method_tooltip,
                options: [
                  {
                    label: this.translate.instant('Quick'),
                    value: DiskWipeMethod.Quick,
                  }, {
                    label: this.translate.instant('Full with zeros'),
                    value: DiskWipeMethod.Full,
                  }, {
                    label: this.translate.instant('Full with random data'),
                    value: DiskWipeMethod.FullRandom,
                  },
                ],
                value: DiskWipeMethod.Quick,
              },
            ],
            saveButtonText: helptext.diskWipeDialogForm.saveButtonText,
            afterInit(entityDialogForm: EntityDialogComponent) {
              entityDialogForm.formGroup.controls['disk_name'].setValue(row.name);
            },
            customSubmit: (entityDialogForm: EntityDialogComponent) => {
              this.dialogService.confirm({
                title: helptext.diskWipeDialogForm.title + row.name,
                message: helptext.diskWipeDialogForm.confirmContent,
              }).pipe(
                filter(Boolean),
                untilDestroyed(this),
              ).subscribe(() => {
                const dialogRef = this.dialog.open(EntityJobComponent, {
                  data: { title: helptext.diskWipeDialogForm.title + row.name },
                });
                dialogRef.componentInstance.setDescription(helptext.diskWipeDialogForm.startDescription);
                dialogRef.componentInstance.setCall(
                  'disk.wipe',
                  [entityDialogForm.formValue.disk_name, entityDialogForm.formValue.wipe_method],
                );
                dialogRef.componentInstance.submit();

                dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
                  if (dialogRef.componentInstance) {
                    dialogRef.close(true);
                    this.dialogService.generalDialog({
                      title: helptext.diskWipeDialogForm.title + row.name,
                      message: helptext.diskWipeDialogForm.infoContent,
                      hideCancel: true,
                    });
                  }
                });
                dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((wipeRes) => {
                  dialogRef.componentInstance.setDescription(wipeRes.error);
                });
                dialogRef.componentInstance.aborted.pipe(untilDestroyed(this)).subscribe(() => {
                  dialogRef.close(true);
                });
                entityDialogForm.dialogRef.close(true);
              });
            },
          };
          this.dialogService.dialogForm(conf);
        },
      });
    }

    return actions as EntityTableAction[];
  }

  dataHandler(entityList: EntityTableComponent): void {
    this.diskUpdate(entityList);
  }

  diskUpdate(entityList: EntityTableComponent): void {
    for (const disk of entityList.rows) {
      disk.readable_size = filesize(disk.size, { standard: 'iec' });
    }
  }

  afterInit(entityList: EntityTableComponent): void {
    this.core.register({
      observerClass: this,
      eventName: 'DisksChanged',
    }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (evt) {
        entityList.getData();
      }
    });

    this.ws.call('disk.get_unused', []).pipe(untilDestroyed(this)).subscribe((unused) => {
      this.unused = unused;
      entityList.getData();
    }, (err) => new EntityUtils().handleWsError(this, err));

    this.ws.call('smart.test.disk_choices').pipe(untilDestroyed(this)).subscribe(
      (res) => {
        this.SMARTdiskChoices = res;
        entityList.getData();
      },
      (err) => new EntityUtils().handleWsError(this, err),
    );
  }

  resourceTransformIncomingRestData(data: Disk[]): Disk[] {
    data.forEach((i) => i.pool = i.pool ? i.pool : 'N/A');
    return data;
  }

  manualTest(selected: Disk | Disk[]): void {
    const disks = Array.isArray(selected) ? selected.map((item) => item.name) : [selected.name];
    const disksIdentifier: SmartManualTestParams[] = Array.isArray(selected)
      ? selected.map((item) => ({ identifier: item.identifier } as SmartManualTestParams))
      : [{ identifier: selected.identifier }] as SmartManualTestParams[];
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
              label: this.translate.instant('LONG'),
              value: SmartTestType.Long,
            },
            {
              label: this.translate.instant('SHORT'),
              value: SmartTestType.Short,
            },
            {
              label: this.translate.instant('CONVEYANCE'),
              value: SmartTestType.Conveyance,
            },
            {
              label: this.translate.instant('OFFLINE'),
              value: SmartTestType.Offline,
            },
          ],
          value: SmartTestType.Long,
        },
      ],
      saveButtonText: helptext.manual_test_dialog.saveButtonText,
      customSubmit: (entityDialog: EntityDialogComponent) => {
        disksIdentifier.forEach((item) => {
          item.type = entityDialog.formValue.type;
        });

        this.ws.call('smart.test.manual_test', [disksIdentifier]).pipe(untilDestroyed(this)).subscribe(
          (res) => {
            entityDialog.dialogRef.close(true);
            this.generateManualTestSummary(res);
          },
          (err) => {
            new EntityUtils().handleWsError(this, err, this.dialogService, conf.fieldConfig);
          },
        );
      },
    };
    this.dialogService.dialogForm(conf);
  }

  generateManualTestSummary(res: ManualSmartTest[]): void {
    let successNote = '<h4>Expected Finished Time:</h4>';
    let hasSuccessNote = false;
    let failNote = '<h4>Errors:</h4>';
    let hasFailNote = false;

    res.forEach((test) => {
      if (test.expected_result_time) {
        hasSuccessNote = true;
        successNote += `<b>${test.disk}</b>: ${this.localeService.formatDateTime(test.expected_result_time.$date)}<br>`;
      } else if (test.error) {
        hasFailNote = true;
        failNote += `<b>${test.disk}</b><br>${test.error}<br>`;
      }
    });
    this.dialogService.info(
      this.translate.instant('Manual Test Summary'),
      (hasSuccessNote ? successNote + '<br>' : '') + (hasFailNote ? failNote : ''),
      '600px',
      'info',
      true,
    );
  }
}
