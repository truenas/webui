import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TooltipPosition } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as filesize from 'filesize';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { Choices } from 'app/interfaces/choices.interface';
import { CoreEvent } from 'app/interfaces/events';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { DiskWipeDialogComponent } from 'app/pages/storage/disks/disk-wipe-dialog/disk-wipe-dialog.component';
import {
  ManualTestDialogComponent,
  ManualTestDialogParams,
} from 'app/pages/storage/disks/manual-test-dialog/manual-test-dialog.component';
import { DialogService, StorageService, WebSocketService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LocaleService } from 'app/services/locale.service';
import { DiskFormComponent } from '../disk-form/disk-form.component';

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
  smartOptions: string[] = [];
  private smartDiskChoices: Choices = {};

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
            this.smartOptions.push(i.smartoptions);
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

        if (this.smartOptions.every((val, i, arr) => val === arr[0])) {
          this.diskbucket.smartOptions = this.smartOptions[0];
        } else {
          this.diskbucket.smartOptions = undefined;
        }

        this.router.navigate(['/', 'storage', 'disks', 'bulk-edit']);
      } else {
        const editForm = this.slideInService.open(DiskFormComponent, { wide: true });
        editForm.setFormDisk(selected[0]);
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
    private matDialog: MatDialog,
    private core: CoreService,
    protected translate: TranslateService,
    private slideInService: IxSlideInService,
  ) {}

  getActions(parentRow: Disk): EntityTableAction[] {
    const actions = [{
      id: parentRow.name,
      icon: 'edit',
      name: 'edit',
      label: this.translate.instant('Edit'),
      onClick: (disk: Disk) => {
        const editForm = this.slideInService.open(DiskFormComponent, { wide: true });
        editForm.setFormDisk(disk);
      },
    }];

    for (const key in this.smartDiskChoices) {
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

    const devMatch = this.unused.filter((dev) => dev.name === parentRow.name);
    if (devMatch.length > 0) {
      actions.push({
        id: parentRow.name,
        icon: 'delete_sweep',
        name: 'wipe',
        label: this.translate.instant('Wipe'),
        onClick: (disk) => {
          this.matDialog.open(DiskWipeDialogComponent, {
            data: disk.name,
          });
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

  prerequisite(): Promise<boolean> {
    return forkJoin([
      this.ws.call('disk.get_unused'),
      this.ws.call('smart.test.disk_choices'),
    ]).pipe(
      map(([unusedDisks, disksThatSupportSmart]) => {
        this.unused = unusedDisks;
        this.smartDiskChoices = disksThatSupportSmart;
        return true;
      }),
      catchError((error) => {
        new EntityUtils().handleWsError(this, error);
        return of(false);
      }),
    ).toPromise();
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
    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      entityList.getData();
      entityList.pageChanged();
    });
  }

  resourceTransformIncomingRestData(disks: Disk[]): Disk[] {
    return disks.map((disk) => ({
      ...disk,
      pool: disk.pool || this.translate.instant('N/A'),
    }));
  }

  manualTest(selected: Disk | Disk[]): void {
    const selectedDisks = Array.isArray(selected) ? selected : [selected];

    this.matDialog.open(ManualTestDialogComponent, {
      data: {
        selectedDisks,
        diskIdsWithSmart: Object.keys(this.smartDiskChoices),
      } as ManualTestDialogParams,
    });
  }
}
