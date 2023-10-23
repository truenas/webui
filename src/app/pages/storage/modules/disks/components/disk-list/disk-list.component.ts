import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TooltipPosition } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as filesize from 'filesize';
import {
  forkJoin, lastValueFrom, of, Subject, switchMap,
} from 'rxjs';
import {
  catchError, debounceTime, filter, map,
} from 'rxjs/operators';
import { SmartTestResultPageType } from 'app/enums/smart-test-results-page-type.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { Choices } from 'app/interfaces/choices.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { Disk, UnusedDisk } from 'app/interfaces/storage.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import {
  DiskBulkEditComponent,
} from 'app/pages/storage/modules/disks/components/disk-bulk-edit/disk-bulk-edit.component';
import { DiskFormComponent } from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';
import {
  DiskWipeDialogComponent,
} from 'app/pages/storage/modules/disks/components/disk-wipe-dialog/disk-wipe-dialog.component';
import {
  ManualTestDialogComponent, ManualTestDialogParams,
} from 'app/pages/storage/modules/disks/components/manual-test-dialog/manual-test-dialog.component';
import { DialogService } from 'app/services/dialog.service';
import { DisksUpdateService } from 'app/services/disks-update.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  template: '<ix-entity-table [title]="title" [conf]="this"></ix-entity-table>',
})
export class DiskListComponent implements EntityTableConfig<Disk>, OnDestroy {
  title = this.translate.instant('Disks');
  queryCall = 'disk.query' as const;
  queryCallOption: QueryParams<Disk, { extra: { pools: boolean; passwords: boolean } }> = [[], {
    extra: {
      pools: true,
      passwords: true,
    },
  }];
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
  private smartDiskChoices: Choices = {};

  multiActions = [{
    id: 'medit',
    label: this.translate.instant('Edit Disk(s)'),
    icon: 'edit',
    enable: true,
    ttpos: 'above' as TooltipPosition,
    onClick: (selected: Disk[]) => {
      if (selected.length > 1) {
        const slideInRef = this.slideInService.open(DiskBulkEditComponent);
        slideInRef.componentInstance.setFormDiskBulk(selected);
        slideInRef.slideInClosed$.pipe(
          filter((response) => Boolean(response)),
          untilDestroyed(this),
        ).subscribe(() => this.updateData());
      } else {
        const slideInRef = this.slideInService.open(DiskFormComponent, { wide: true });
        slideInRef.componentInstance.setFormDisk(selected[0]);
        slideInRef.slideInClosed$.pipe(
          filter((response) => Boolean(response)),
          untilDestroyed(this),
        ).subscribe(() => this.updateData());
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

  private diskUpdateSubscriptionId: string;
  private entityList: EntityTableComponent<Disk>;

  protected unusedDisks: UnusedDisk[] = [];
  constructor(
    protected ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    protected router: Router,
    private matDialog: MatDialog,
    protected translate: TranslateService,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
    private disksUpdate: DisksUpdateService,
  ) {}

  ngOnDestroy(): void {
    this.disksUpdate.removeSubscriber(this.diskUpdateSubscriptionId);
  }

  getActions(parentRow: Disk): EntityTableAction[] {
    const actions = [{
      id: parentRow.name,
      icon: 'edit',
      name: 'edit',
      label: this.translate.instant('Edit'),
      onClick: (disk: Disk) => {
        const slideInRef = this.slideInService.open(DiskFormComponent, { wide: true });
        slideInRef.componentInstance.setFormDisk(disk);
        slideInRef.slideInClosed$.pipe(
          filter((response) => Boolean(response)),
          untilDestroyed(this),
        ).subscribe(() => this.updateData());
      },
    }];

    const isSmartSupported = Object.keys(this.smartDiskChoices).includes(parentRow.identifier);
    if (isSmartSupported) {
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
        label: this.translate.instant('S.M.A.R.T. Test Results'),
        onClick: (row) => {
          this.router.navigate(['/storage', 'disks', 'smartresults', SmartTestResultPageType.Disk, row.name]);
        },
      });
    }

    const devMatch = this.unusedDisks.filter((dev) => dev.name === parentRow.name);
    if (devMatch.length > 0) {
      actions.push({
        id: parentRow.name,
        icon: 'delete_sweep',
        name: 'wipe',
        label: this.translate.instant('Wipe'),
        onClick: (diskToWipe): void => {
          const unusedDisk: Partial<UnusedDisk> = this.unusedDisks.find(
            (disk) => disk.devname === diskToWipe.devname,
          );
          this.matDialog.open(DiskWipeDialogComponent, {
            data: {
              diskName: diskToWipe.name,
              exportedPool: unusedDisk?.exported_zpool,
            },
          });
        },
      });
    }

    return actions as EntityTableAction[];
  }

  prerequisite(): Promise<boolean> {
    return lastValueFrom(
      forkJoin([
        this.ws.call('disk.get_unused'),
        this.ws.call('smart.test.disk_choices'),
      ]).pipe(
        map(([unusedDisks, disksThatSupportSmart]) => {
          this.unusedDisks = unusedDisks;
          this.smartDiskChoices = disksThatSupportSmart;
          return true;
        }),
        catchError((error: WebsocketError) => {
          this.dialogService.error(this.errorHandler.parseWsError(error));
          return of(false);
        }),
      ),
    );
  }

  afterInit(entityList: EntityTableComponent<Disk>): void {
    const disksUpdateTrigger$ = new Subject<ApiEvent<Disk>>();
    disksUpdateTrigger$.pipe(
      debounceTime(50),
      switchMap(() => this.ws.call('disk.get_unused')),
      untilDestroyed(this),
    ).subscribe((unusedDisks) => {
      this.unusedDisks = unusedDisks;
      entityList.getData();
    });
    this.diskUpdateSubscriptionId = this.disksUpdate.addSubscriber(disksUpdateTrigger$);
    this.entityList = entityList;
  }

  resourceTransformIncomingRestData(disks: Disk[]): Disk[] {
    return disks.map((disk) => ({
      ...disk,
      pool: this.getPoolColumn(disk),
      readable_size: filesize(disk.size, { standard: 'iec' }),
    }));
  }

  getPoolColumn(diskToCheck: Disk): string {
    const unusedDisk = this.unusedDisks.find((disk) => disk.devname === diskToCheck.devname);
    if (unusedDisk?.exported_zpool) {
      return unusedDisk.exported_zpool + ' (' + this.translate.instant('Exported') + ')';
    }
    return diskToCheck.pool || this.translate.instant('N/A');
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

  updateData(): void {
    this.entityList.getData();
    this.entityList.pageChanged();
  }
}
