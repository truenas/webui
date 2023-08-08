import {
  AfterViewInit, Component, OnInit, ViewChild,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { SortDirection } from '@angular/material/sort';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { DatatableComponent } from '@siemens/ngx-datatable';
import * as filesize from 'filesize';
import * as _ from 'lodash';
import { of } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { GiB, MiB } from 'app/constants/bytes.constant';
import { DiskBus } from 'app/enums/disk-bus.enum';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import {
  CreatePool,
  Pool,
  UpdatePool,
  UpdatePoolTopology,
  UpdatePoolTopologyGroup,
} from 'app/interfaces/pool.interface';
import { TopologyDisk } from 'app/interfaces/storage.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ManagerVdev } from 'app/pages/storage/components/manager/classes/manager-vdev.class';
import { DownloadKeyDialogOldComponent } from 'app/pages/storage/components/manager/download-key-old/download-key-dialog-old.component';
import { ExportedPoolsDialogComponent } from 'app/pages/storage/components/manager/exported-pools-dialog/exported-pools-dialog.component';
import {
  RepeatVdevDialogComponent, RepeatVdevDialogData,
} from 'app/pages/storage/components/manager/repeat-vdev-dialog/repeat-vdev-dialog.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';
import { ManagerDisk } from './manager-disk.interface';
import { VdevComponent } from './vdev/vdev.component';

export type ManagerVdevs = { [group in UpdatePoolTopologyGroup]: ManagerVdev[] };

@UntilDestroy()
@Component({
  templateUrl: 'manager.component.html',
  styleUrls: ['manager.component.scss'],
  providers: [DialogService],
})
export class ManagerComponent implements OnInit, AfterViewInit {
  disks: ManagerDisk[] = [];
  suggestableDisks: ManagerDisk[] = [];
  selected: ManagerDisk[] = [];
  vdevs: ManagerVdevs = {
    data: [], cache: [], spares: [], log: [], special: [], dedup: [],
  };
  originalDisks: ManagerDisk[] = [];
  originalSuggestableDisks: ManagerDisk[] = [];
  error: string;

  @ViewChild('paginator') paginator: MatPaginator;
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  // TODO: Rename to something more readable
  temp: ManagerDisk[] = [];

  nameControl = new FormControl('', [Validators.required, Validators.maxLength(50)]);
  addCall = 'pool.create' as const;
  editCall = 'pool.update' as const;
  queryCall = 'pool.query' as const;
  datasetQueryCall = 'pool.dataset.query' as const;
  pk: number;
  isNew = true;
  volEncrypt = 0;
  isEncryptedControl = new FormControl(false);
  encryptionAlgorithmControl = new FormControl('AES-256-GCM');
  encryptionAlgorithmOptions: Option[] = [];
  regExpHasErrors = false;
  nameFilter: RegExp;
  capacityFilter: RegExp;
  nameFilterControl = new FormControl('');
  capacityFilterControl = new FormControl('');
  dirty = false;
  protected existingPools: Pool[] = [];
  poolError: string = null;
  help = helptext;
  exportedPoolsWarnings: string[] = [];

  shownDataVdevs: ManagerVdev[] = [];
  lastPageChangedEvent: PageEvent = { pageIndex: 0, length: 1, pageSize: 10 };

  submitTitle: string = this.translate.instant('Create');
  protected extendedSubmitTitle: string = this.translate.instant('Add Vdevs');

  protected needsDisk = true;
  size: string;
  protected extendedAvailable: number;
  sizeMessage: string = helptext.manager_sizeMessage;
  protected extendedSizeMessage = helptext.manager_extendedSizeMessage;

  disknumError: string = null;
  disknumErrorMessage = helptext.manager_disknumErrorMessage;
  disknumErrorConfirmMessage = helptext.manager_disknumErrorConfirmMessage;
  disknumExtendConfirmMessage = helptext.manager_disknumExtendConfirmMessage;

  vdevtypeError: string = null;
  vdevtypeErrorMessage = helptext.manager_vdevtypeErrorMessage;

  emptyDataVdev = true;

  stripeVdevTypeError: string = null;
  logVdevTypeWarning: string = null;

  vdevdisksError = false;
  hasVdevDiskSizeError = false;

  diskAddWarning = helptext.manager_diskAddWarning;
  diskExtendWarning = helptext.manager_diskExtendWarning;

  firstDataVdevType: string;
  firstDataVdevDisknum = 0;
  firstDataVdevDisksize: number;
  firstDataVdevDisktype: DiskType;

  private duplicableDisks: ManagerDisk[] = [];

  canDuplicate = false;

  nameTooltip = helptext.manager_name_tooltip;
  encryptionTooltip = helptext.manager_encryption_tooltip;
  suggestedLayoutTooltip = helptext.manager_suggested_layout_tooltip;

  encryptionMessage = helptext.manager_encryption_message;

  startingHeight: number;
  expandedRows: number;
  swapondrive = 2;

  hasSavableErrors = false;
  forceControl = new FormControl(false);

  protected mindisks = {
    stripe: 1, mirror: 2, raidz: 3, raidz2: 4, raidz3: 5,
  };

  includeNonUniqueSerialDisks = false;
  nonUniqueSerialDisks: ManagerDisk[] = [];

  get availableNonUniqueSerialDisksCount(): number {
    if (this.originalDisks.length === this.temp.length) {
      return this.nonUniqueSerialDisks.length;
    }
    return this.temp.filter((disk) => this.nonUniqueSerialDisks.includes(disk)).length;
  }

  get nonUniqueSerialDisksWarning(): string {
    if (!this.nonUniqueSerialDisks.length) {
      return null;
    }

    if (this.nonUniqueSerialDisks.every((disk) => disk.bus === DiskBus.Usb)) {
      return this.translate.instant('Warning: There are {n} USB disks available that have non-unique serial numbers. USB controllers may report disk serial incorrectly, making such disks indistinguishable from each other. Adding such disks to a pool can result in lost data.', { n: this.availableNonUniqueSerialDisksCount });
    }

    return this.translate.instant('Warning: There are {n} disks available that have non-unique serial numbers. Non-unique serial numbers can be caused by a cabling issue and adding such disks to a pool can result in lost data.', { n: this.availableNonUniqueSerialDisksCount });
  }

  constructor(
    private ws: WebSocketService,
    private router: Router,
    private dialog: DialogService,
    private loader: AppLoaderService,
    protected route: ActivatedRoute,
    private errorHandler: ErrorHandlerService,
    public mdDialog: MatDialog,
    public translate: TranslateService,
    public sorter: StorageService,
    private store$: Store<AppState>,
  ) {}

  showRepeatDialog(): void {
    this.mdDialog.open(RepeatVdevDialogComponent, {
      data: {
        firstDataVdevDiskNumber: this.firstDataVdevDisknum,
        duplicableDisksCount: this.duplicableDisks.length,
        size: filesize(this.firstDataVdevDisksize, { standard: 'iec' }),
        diskType: this.firstDataVdevDisktype,
        vdevType: this.firstDataVdevType,
      } as RepeatVdevDialogData,
    })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((count: number | null) => {
        if (count === null) {
          return;
        }

        this.repeatVdevs(count);
      });
  }

  repeatVdevs(count: number): void {
    const pageIndexBefore = this.lastPageChangedEvent.pageIndex;

    for (let i = 0; i < count; i++) {
      const vdevValues: ManagerVdev = new ManagerVdev(this.firstDataVdevType, 'data');
      for (let n = 0; n < this.firstDataVdevDisknum; n++) {
        const duplicateDisk = this.duplicableDisks.shift();
        vdevValues.disks.push(duplicateDisk);
        this.disks.splice(this.disks.findIndex((disk) => disk.devname === duplicateDisk.devname), 1);
        // remove disk from selected
        this.selected = _.remove(this.selected, (disk) => disk.devname !== duplicateDisk.devname);
      }
      this.addVdev('data', vdevValues);
    }
    this.paginator.pageIndex = pageIndexBefore;
    this.onPageChange({
      ...this.lastPageChangedEvent,
      length: this.vdevs.data.length,
      pageIndex: pageIndexBefore,
    });
    setTimeout(() => this.getCurrentLayout(), 100);
  }

  getDiskNumErrorMsg(disks: number): void {
    this.disknumError = `${this.translate.instant(this.disknumErrorMessage)} ${this.translate.instant('First vdev has {n} disks, new vdev has {m}', { n: this.firstDataVdevDisknum, m: disks })}`;
  }

  getVdevTypeErrorMsg(type: string): void {
    this.vdevtypeError = `${this.translate.instant(this.vdevtypeErrorMessage)} ${this.translate.instant('First vdev is a {vdevType}, new vdev is {newVdevType}', { vdevType: this.firstDataVdevType, newVdevType: type })}`;
  }

  onPageChange(pageEvent: PageEvent): void {
    this.lastPageChangedEvent = pageEvent;
    const offset = pageEvent.pageIndex * pageEvent.pageSize;
    const endIndex = Math.min(offset + pageEvent.pageSize, pageEvent.length);
    this.shownDataVdevs = _.cloneDeep(this.vdevs.data.slice(offset, endIndex));
  }

  getStripeVdevTypeErrorMsg(group: string): void {
    const vdevType = group === 'special' ? 'metadata' : group;
    this.stripeVdevTypeError = this.translate.instant('A stripe {vdevType} vdev is highly discouraged and will result in data loss if it fails', { vdevType });
  }

  getLogVdevTypeWarningMsg(): void {
    this.logVdevTypeWarning = this.translate.instant('A stripe log vdev may result in data loss if it fails combined with a power outage.');
  }

  onVdevChanged(changedVdev: ManagerVdev): void {
    const index = this.vdevs[changedVdev.group].findIndex((vdev: { uuid: string }) => vdev.uuid === changedVdev.uuid);
    if (index < 0) {
      return;
    }
    this.vdevs[changedVdev.group][index].disks = [...changedVdev.disks];
    this.vdevs[changedVdev.group][index].type = changedVdev.type;
  }

  getPoolData(): void {
    this.ws.call(this.queryCall, [[['id', '=', this.pk]]])
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe({
        next: (searchedPools) => {
          if (!searchedPools[0]) {
            return;
          }

          this.firstDataVdevType = searchedPools[0].topology.data[0].type.toLowerCase();
          if (this.firstDataVdevType === 'raidz1') {
            this.firstDataVdevType = 'raidz';
          }
          this.firstDataVdevDisknum = searchedPools[0].topology.data[0].children.length;

          let firstDisk: TopologyDisk;
          if (this.firstDataVdevDisknum === 0 && this.firstDataVdevType === 'disk') {
            this.firstDataVdevDisknum = 1;
            this.firstDataVdevType = 'stripe';
            firstDisk = searchedPools[0].topology.data[0] as TopologyDisk;
          } else {
            firstDisk = searchedPools[0].topology.data[0].children[0];
          }
          this.ws.call('disk.query', [[['name', '=', firstDisk.disk]]])
            .pipe(
              this.errorHandler.catchError(),
              untilDestroyed(this),
            )
            .subscribe({
              next: (disk) => {
                if (disk[0]) {
                  this.firstDataVdevDisksize = disk[0].size;
                  this.firstDataVdevDisktype = disk[0].type;
                }
                this.getDuplicableDisks();
              },
            });
          this.nameControl.setValue(searchedPools[0].name);
          this.volEncrypt = searchedPools[0].encrypt;
          this.ws.call(this.datasetQueryCall, [[['id', '=', searchedPools[0].name]]])
            .pipe(
              this.errorHandler.catchError(),
              untilDestroyed(this),
            )
            .subscribe({
              next: (datasets) => {
                if (datasets[0]) {
                  this.extendedAvailable = datasets[0].available.parsed;
                  this.size = filesize(this.extendedAvailable, { standard: 'iec' });
                }
              },
            });
        },
      });
  }

  ngOnInit(): void {
    this.ws.call('pool.dataset.encryption_algorithm_choices')
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe({
        next: (algorithms) => {
          Object.keys(algorithms).forEach((algorithm) => {
            this.encryptionAlgorithmOptions.push({ label: algorithm, value: algorithm });
          });
        },
      });
    this.store$.pipe(waitForAdvancedConfig, untilDestroyed(this)).subscribe({
      next: (config) => {
        this.swapondrive = config.swapondrive;
      },
    });
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      if (params.poolId) {
        this.pk = parseInt(params.poolId, 10);
        this.isNew = false;
      }
    });
    this.size = filesize(0, { standard: 'iec' });
    if (!this.isNew) {
      this.submitTitle = this.extendedSubmitTitle;
      this.sizeMessage = this.extendedSizeMessage;
      this.getPoolData();
    } else {
      this.ws.call(this.queryCall, []).pipe(this.errorHandler.catchError(), untilDestroyed(this)).subscribe({
        next: (pools) => {
          if (pools) {
            this.existingPools = pools;
          }
        },
      });
    }
    this.nameFilter = new RegExp('');
    this.capacityFilter = new RegExp('');
  }

  ngAfterViewInit(): void {
    this.addVdev('data', new ManagerVdev(this.firstDataVdevDisktype, 'data'));
    this.dirty = false;

    this.ws.call('disk.get_unused', [])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe({
        next: (unusedDisks) => {
          this.disks = unusedDisks.map((disk) => {
            const details: Option[] = [];
            if (disk.rotationrate) {
              details.push({ label: this.translate.instant('Rotation Rate'), value: disk.rotationrate });
            }
            details.push({ label: this.translate.instant('Model'), value: disk.model });
            details.push({ label: this.translate.instant('Serial'), value: disk.serial });
            if (disk.enclosure) {
              details.push({ label: this.translate.instant('Enclosure'), value: disk.enclosure.number });
            }
            return {
              ...disk,
              details,
              real_capacity: disk.size,
              capacity: filesize(disk.size, { standard: 'iec' }),
            };
          });

          this.disks = this.sorter.tableSorter(this.disks, 'devname', 'asc');
          this.originalDisks = Array.from(this.disks);

          // assign disks for suggested layout
          let largestCapacity = 0;
          this.disks.forEach((disk) => {
            if (disk.real_capacity > largestCapacity) {
              largestCapacity = disk.real_capacity;
            }
          });
          this.disks.forEach((disk) => {
            if (disk.real_capacity === largestCapacity) {
              this.suggestableDisks.push(disk);
            }
          });
          this.originalSuggestableDisks = Array.from(this.suggestableDisks);

          this.temp = [...this.disks];
          this.nonUniqueSerialDisks = this.disks.filter((disk) => disk.duplicate_serial.length);
          this.disks = this.disks.filter((disk) => !disk.duplicate_serial.length);
          this.getDuplicableDisks();
        },
      });
  }

  addVdev(
    group: keyof ManagerVdevs,
    initialValues: ManagerVdev = new ManagerVdev(this.firstDataVdevType, 'data'),
  ): void {
    this.dirty = true;
    this.vdevs[group].push(initialValues);
    if (group === 'data') {
      this.reaffirmDataVdevsLastPage();
    }
    setTimeout(() => this.getCurrentLayout(), 100);
  }

  removeVdev(changedVdev: VdevComponent): void {
    const indexRemove = this.vdevs[changedVdev.group].findIndex(
      (vdev: { uuid: string }) => vdev.uuid === changedVdev.uuid,
    );

    if (indexRemove < 0) {
      return;
    }

    if (changedVdev.group === 'data') {
      this.vdevs[changedVdev.group].splice(indexRemove, 1);
      this.reaffirmDataVdevsLastPage();
    } else {
      this.vdevs[changedVdev.group] = []; // should only be one vdev of other groups at one time
    }

    setTimeout(() => this.getCurrentLayout(), 100);
  }

  private reaffirmDataVdevsLastPage(): void {
    let pageIndex = this.lastPageChangedEvent.pageIndex;
    pageIndex = pageIndex < 0 ? 0 : pageIndex;
    const pageSize = this.lastPageChangedEvent.pageSize;
    const vdevsLength = this.vdevs.data.length;
    const indexOfLastVdev = vdevsLength - 1;

    this.paginator.length = vdevsLength;
    const lastIndexOnCurrentPage = ((pageIndex + 1) * pageSize) - 1;
    const lastIndexOnPrevPage = (((pageIndex + 1) * pageSize) - pageSize) - 1;
    const lastPage = Math.floor((vdevsLength / pageSize));
    if (lastPage === pageIndex + 1 && lastIndexOnCurrentPage < indexOfLastVdev) {
      pageIndex++;
      this.paginator.pageIndex = pageIndex;
    } else if (lastIndexOnPrevPage >= indexOfLastVdev) {
      pageIndex--;
      this.paginator.pageIndex = pageIndex;
    }
    this.onPageChange({
      ...this.lastPageChangedEvent,
      length: vdevsLength,
      pageIndex,
    });
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  getCurrentLayout(): void {
    let sizeEstimate = 0;
    if (!this.isNew) {
      sizeEstimate = this.extendedAvailable || 0;
    }
    let dataVdevDisknum = 0;
    let wasDataDiskFound = false;
    let wereAnyDisksFound = false;
    let dataVdevType: string;
    this.disknumError = null;
    this.vdevtypeError = null;
    this.vdevdisksError = false;
    this.stripeVdevTypeError = null;
    this.logVdevTypeWarning = null;
    this.hasVdevDiskSizeError = false;
    this.hasSavableErrors = false;
    this.emptyDataVdev = false;

    const allVdevs = this.mapAllVdevsToVdevInfo();
    allVdevs.forEach((vdev, i) => {
      this.estimateSize(vdev);
      if (vdev.group === 'data') {
        if (i === 0 && this.isNew) {
          this.firstDataVdevType = vdev.type;
          dataVdevType = vdev.type;
          if (vdev.disks.length > 0) {
            this.firstDataVdevDisknum = vdev.disks.length;
            this.firstDataVdevDisksize = vdev.disks[0].size;
            this.firstDataVdevDisktype = vdev.disks[0].type;
            this.canDuplicate = true;
          } else {
            this.firstDataVdevDisknum = 0;
            this.firstDataVdevDisksize = null;
            this.firstDataVdevDisktype = null;
            this.canDuplicate = false;
          }
        }
        if (vdev.disks.length > 0) {
          wasDataDiskFound = true;
          dataVdevDisknum = vdev.disks.length;
          dataVdevType = vdev.type;
        } else {
          this.emptyDataVdev = true;
          dataVdevDisknum = 0;
        }
        sizeEstimate += vdev.rawSize;
        if (dataVdevDisknum > 0) {
          if (dataVdevDisknum !== this.firstDataVdevDisknum && this.firstDataVdevType !== 'stripe') {
            this.getDiskNumErrorMsg(dataVdevDisknum);
          }
          if (dataVdevType !== this.firstDataVdevType) {
            this.getVdevTypeErrorMsg(dataVdevType);
          }
        }
      } else if (vdev.disks.length > 0) {
        wereAnyDisksFound = true;
      }
      if (vdev.vdevDisksError) {
        this.vdevdisksError = true;
      }
      if (vdev.showDiskSizeError) {
        this.hasVdevDiskSizeError = true;
        this.hasSavableErrors = true;
      }
      if (
        ['dedup', 'log', 'special', 'data'].includes(vdev.group)
        && vdev.disks.length >= 1 && vdev.type.toLowerCase() === 'stripe'
      ) {
        if (vdev.group === 'log') {
          this.getLogVdevTypeWarningMsg();
        } else {
          this.getStripeVdevTypeErrorMsg(vdev.group);
        }

        this.hasSavableErrors = true;
      }
    });
    if (this.isNew) {
      this.needsDisk = !wasDataDiskFound;
    } else if (wasDataDiskFound || wereAnyDisksFound) {
      this.needsDisk = false;
    } else {
      this.needsDisk = true;
    }
    this.size = filesize(sizeEstimate, { standard: 'iec' });

    this.getDuplicableDisks();

    this.updateExportedPoolWarningFlags(this.selected);
  }

  mapAllVdevsToVdevInfo(): ManagerVdev[] {
    const allVdevs: ManagerVdev[] = [];
    for (const group of Object.keys(this.vdevs) as (keyof ManagerVdevs)[]) {
      for (const vdev of this.vdevs[group]) {
        allVdevs.push({ ...vdev, group });
      }
    }
    return allVdevs;
  }

  getDuplicableDisks(): void {
    this.duplicableDisks = [];
    this.disks.forEach((disk) => {
      if (disk.size === this.firstDataVdevDisksize && disk.type === this.firstDataVdevDisktype) {
        this.duplicableDisks.push(disk);
      }
    });
    if (!this.firstDataVdevDisknum || this.duplicableDisks.length < this.firstDataVdevDisknum) {
      this.canDuplicate = false;
    } else {
      this.canDuplicate = true;
    }
  }

  canSave(): boolean {
    if (this.isNew && (!this.nameControl.value || this.nameControl.value.length > 50)) {
      return false;
    }
    if (this.vdevtypeError) {
      return false;
    }
    if (this.needsDisk) {
      return false;
    }
    if (this.poolError) {
      return false;
    }
    if (this.vdevdisksError) {
      return false;
    }
    if (this.hasSavableErrors && !this.forceControl.value) {
      return false;
    }
    return true;
  }

  canAddData(): boolean {
    if (this.emptyDataVdev) {
      return false;
    }
    if (this.disks.length < this.mindisks[this.firstDataVdevType as keyof ManagerComponent['mindisks']]) {
      return false;
    }
    return true;
  }

  handleSelectAll(selectFn: (flag: boolean) => void, allSelectedFlag: boolean): void {
    if (allSelectedFlag) {
      for (const disk of this.disks) {
        if (this.shouldWarnForExportedPool(disk)) {
          this.dialog.warn(
            this.translate.instant('Warning') + ': ' + disk.name,
            this.translate.instant(helptext.exported_pool_warning, { pool: `'${disk.exported_zpool}'` }),
          );
        }
      }
    }
    this.updateExportedPoolWarningFlags(allSelectedFlag ? this.disks : []);
    selectFn(allSelectedFlag);
  }

  checkSubmit(): void {
    let disknumErr: string = this.disknumErrorConfirmMessage;
    if (!this.isNew) {
      disknumErr = this.disknumExtendConfirmMessage;
    }
    if (this.disknumError) {
      this.dialog.confirm({
        title: this.translate.instant('Warning'),
        message: disknumErr,
      }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        this.doSubmit();
      });
    } else {
      this.doSubmit();
    }
  }

  forceCheckboxChecked(): void {
    if (this.forceControl.value) {
      return;
    }

    let warnings: string = helptext.force_warning;
    if (this.hasVdevDiskSizeError) {
      warnings = warnings + '<br/><br/>' + helptext.force_warnings.diskSizeWarning;
    }
    if (this.stripeVdevTypeError) {
      warnings = warnings + '<br/><br/>' + this.stripeVdevTypeError;
    }
    this.dialog.confirm({
      title: helptext.force_title,
      message: warnings,
    }).pipe(untilDestroyed(this)).subscribe((force) => {
      this.forceControl.setValue(force);
    });
  }

  doSubmit(): void {
    let confirmButton: string = this.translate.instant('Create Pool');
    let diskWarning: string = this.diskAddWarning;
    let allowDuplicateSerials = false;
    if (!this.isNew) {
      confirmButton = this.translate.instant('Add Vdevs');
      diskWarning = this.diskExtendWarning;
    }

    this.dialog.confirm({
      title: this.translate.instant('Warning'),
      message: diskWarning,
      buttonText: confirmButton,
    })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.error = null;

        const layout: UpdatePoolTopology = {};
        const allVdevs = this.mapAllVdevsToVdevInfo();
        allVdevs.forEach((vdevComponent) => {
          const disks: string[] = [];
          vdevComponent.disks.forEach((disk) => {
            if (disk.duplicate_serial?.length) {
              allowDuplicateSerials = true;
            }
            disks.push(disk.devname);
          });
          if (disks.length > 0) {
            let type = vdevComponent.type.toUpperCase();
            type = type === 'RAIDZ' ? CreateVdevLayout.Raidz1 : type;
            const group = vdevComponent.group;
            if (!layout[group]) {
              layout[group] = [];
            }
            if (group === 'spares') {
              layout[group] = disks;
            } else {
              (layout[group] as { type: CreateVdevLayout; disks: string[] }[]).push({
                disks,
                type: type as CreateVdevLayout,
              });
            }
          }
        });

        let body: CreatePool | UpdatePool;
        if (this.isNew) {
          body = {
            name: this.nameControl.value,
            encryption: this.isEncryptedControl.value,
            topology: layout,
          } as CreatePool;

          if (this.isEncryptedControl.value) {
            (body as CreatePool).encryption_options = {
              generate_key: true,
              algorithm: this.encryptionAlgorithmControl.value,
            };
          }
        } else {
          body = { topology: layout } as UpdatePool;
        }

        if (allowDuplicateSerials) {
          body.allow_duplicate_serials = true;
        }

        const dialogRef = this.mdDialog.open(EntityJobComponent, {
          data: { title: confirmButton, disableClose: true },
        });
        if (this.pk) {
          dialogRef.componentInstance.setCall(this.editCall, [this.pk, body as UpdatePool]);
        } else {
          dialogRef.componentInstance.setCall(this.addCall, [body as CreatePool]);
        }
        dialogRef.componentInstance.success
          .pipe(
            switchMap((job: Job<Pool>) => {
              if (this.isEncryptedControl.value) {
                const downloadDialogRef = this.mdDialog.open(DownloadKeyDialogOldComponent, { disableClose: true });
                downloadDialogRef.componentInstance.new = true;
                downloadDialogRef.componentInstance.volumeId = job.result.id;
                downloadDialogRef.componentInstance.volumeName = job.result.name;
                downloadDialogRef.componentInstance.fileName = 'dataset_' + job.result.name + '_keys.json';

                return downloadDialogRef.afterClosed();
              }

              return of(true);
            }),
            take(1),
          )
          .pipe(untilDestroyed(this)).subscribe(
            {
              next: () => {},
              complete: () => {
                dialogRef.close(false);
                this.goBack();
              },
            },
          );
        dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe({
          next: (error) => {
            dialogRef.close(false);
            this.dialog.error(this.errorHandler.parseJobError(error));
          },
        });
        dialogRef.componentInstance.submit();
      });
  }

  goBack(): void {
    this.router.navigate(['/storage']);
  }

  openDialog(): void {
    if (this.isEncryptedControl.value) {
      this.dialog.confirm({
        title: this.translate.instant('Warning'),
        message: this.encryptionMessage,
        buttonText: this.translate.instant('I Understand'),
      }).pipe(untilDestroyed(this)).subscribe((confirmed) => {
        if (confirmed) {
          this.isEncryptedControl.setValue(true);
          this.volEncrypt = 1;
        } else {
          this.isEncryptedControl.setValue(false);
          this.volEncrypt = 0;
        }
      });
    } else {
      this.isEncryptedControl.setValue(false);
      this.volEncrypt = 0;
    }
  }

  isEncryptedChecked(): void {
    this.openDialog();
  }

  addDisk(disk: ManagerDisk): void {
    this.disks.push(disk);
    this.disks = [...this.disks];
    this.temp.push(disk);
    this.disks = this.sorter.tableSorter(this.disks, 'devname', 'asc');
  }

  removeDisk(diskToRemove: ManagerDisk): void {
    const index = this.disks.findIndex((disk) => disk.devname === diskToRemove.devname);
    if (index >= 0) {
      this.disks.splice(index, 1);
      this.dirty = true;
    }

    this.disks = [...this.disks];
    const tempIndex = this.temp.findIndex((disk) => disk.devname === diskToRemove.devname);
    if (tempIndex >= 0) {
      this.temp.splice(tempIndex, 1);
      this.dirty = true;
    }
    this.temp = [...this.temp];
    setTimeout(() => this.getCurrentLayout(), 100);
  }

  onSelect({ selected }: { selected: ManagerDisk[] }): void {
    this.warnAboutExportedPool(selected);
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  warnAboutExportedPool(selectedDisks: ManagerDisk[]): void {
    if (selectedDisks.length && this.shouldWarnForExportedPool(selectedDisks[selectedDisks.length - 1])) {
      const lastSelectedItem = selectedDisks[selectedDisks.length - 1];
      this.dialog.warn(
        this.translate.instant('Warning') + ': ' + lastSelectedItem.name,
        this.translate.instant(helptext.exported_pool_warning, { pool: `'${lastSelectedItem.exported_zpool}'` }),
      );
    }
    this.updateExportedPoolWarningFlags(selectedDisks);
  }

  updateExportedPoolWarningFlags(selectedDisks: ManagerDisk[]): void {
    const selectedDisksWithPools = selectedDisks.filter((selectedDisk) => selectedDisk.exported_zpool);
    this.exportedPoolsWarnings = selectedDisksWithPools.map(
      (selectedDisk) => selectedDisk.devname,
    );
  }

  shouldWarnForExportedPool(disk: ManagerDisk): boolean {
    const lastSelectedDisk = disk;
    const wasAlreadyWarnedAboutThisDisk = this.exportedPoolsWarnings.find(
      (warningDisk) => warningDisk === lastSelectedDisk.devname,
    );
    return lastSelectedDisk.exported_zpool && !wasAlreadyWarnedAboutThisDisk;
  }

  updateFilter(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.toLowerCase();
    let re;
    try {
      re = new RegExp(val);
    } catch (error: unknown) {
      this.regExpHasErrors = true;
    }

    // filter our data
    if (re) {
      if (input.id === 'pool-manager__nameFilter') {
        this.nameFilter = re;
      } else if (input.id === 'pool-manager__capacityFilter') {
        this.capacityFilter = re;
      }

      this.regExpHasErrors = false;

      // update the rows
      this.disks = this.temp.filter((disk) => {
        return this.nameFilter.test(disk.devname.toLowerCase())
          && this.capacityFilter.test(disk.capacity.toLowerCase());
      });

      // Whenever the filter changes, always go back to the first page
      this.table.offset = 0;
    }
  }

  suggestLayout(): void {
    // todo: add more layouts, manipulating multiple vdevs is hard
    this.suggestRedundancyLayout();
  }

  resetLayout(): void {
    Object.keys(this.vdevs).forEach((group: UpdatePoolTopologyGroup) => {
      while (this.vdevs[group].length > 0) {
        this.vdevs[group].pop();
      }
    });
    this.nameFilter = new RegExp('');
    this.capacityFilter = new RegExp('');
    this.addVdev('data', new ManagerVdev('stripe', 'data'));
    this.disks = Array.from(this.originalDisks);
    this.suggestableDisks = Array.from(this.originalSuggestableDisks);
    this.temp = [...this.disks];
    this.dirty = false;
    this.table.offset = 0;
    this.paginator.pageIndex = 0;
    this.paginator.length = 1;
    this.paginator.pageSize = 10;
    this.onPageChange({ pageIndex: 0, pageSize: 10, length: 1 });
    setTimeout(() => this.getCurrentLayout(), 100);
  }

  suggestRedundancyLayout(): void {
    this.selected = [];
    const exportedPoolsDisks: ManagerDisk[] = [];
    this.suggestableDisks.forEach((disk) => {
      if (disk.exported_zpool) {
        exportedPoolsDisks.push(disk);
      }
      this.vdevs.data[0].disks.push(disk);
    });
    while (this.suggestableDisks.length > 0) {
      this.removeDisk(this.suggestableDisks[0]);
      this.suggestableDisks.shift();
    }
    if (exportedPoolsDisks.length) {
      const formattedDisks = exportedPoolsDisks.map(
        (disk) => ({ diskName: disk.name, exportedPool: disk.exported_zpool }),
      );
      this.mdDialog.open(ExportedPoolsDialogComponent, { data: { disks: formattedDisks } });
    }
    this.onPageChange(this.lastPageChangedEvent);
  }

  checkPoolName(): void {
    if (_.find(this.existingPools, { name: this.nameControl.value })) {
      this.poolError = this.translate.instant('A pool with this name already exists.');
    } else {
      this.poolError = null;
    }
  }

  reorderEvent(event: { sorts: { prop: keyof ManagerDisk; dir: SortDirection }[] }): void {
    const sort = event.sorts[0];
    const rows = this.disks;
    this.sorter.tableSorter(rows, sort.prop, sort.dir);
  }

  toggleExpandRow(row: unknown): void {
    if (!this.startingHeight) {
      this.startingHeight = document.getElementsByClassName('ngx-datatable')[0].clientHeight;
    }
    this.table.rowDetail.toggleExpandRow(row);
    setTimeout(() => {
      this.expandedRows = document.querySelectorAll('.datatable-row-detail').length;
      const newHeight = (this.expandedRows * 100) + this.startingHeight;
      const heightStr = `height: ${newHeight}px`;
      document.getElementsByClassName('ngx-datatable')[0].setAttribute('style', heightStr);
    }, 100);
  }

  toggleNonUniqueSerialDisks(): void {
    this.includeNonUniqueSerialDisks = !this.includeNonUniqueSerialDisks;
    if (this.includeNonUniqueSerialDisks) {
      this.disks = this.originalDisks.filter((disk) => this.temp.includes(disk));
    } else {
      this.disks = this.disks.filter((disk) => !this.nonUniqueSerialDisks.includes(disk));
    }
  }

  getDataVdevTitle(index: number): string {
    let title = `${this.translate.instant('Vdev')} (`;
    const offset = this.paginator.pageSize * this.paginator.pageIndex;
    const vdevNo = offset + index + 1;
    title += `${vdevNo}/${this.paginator.length})`;
    return title;
  }

  estimateSize(vdev: ManagerVdev): void {
    let totalsize = 0;
    let stripeSize = 0;
    let smallestdisk = 0;
    let estimate = 0;
    const swapsize = this.swapondrive * GiB;
    vdev.showDiskSizeError = false;
    for (let i = 0; i < vdev.disks.length; i++) {
      const size = vdev.disks[i].real_capacity - swapsize;
      stripeSize += size;
      if (i === 0) {
        smallestdisk = size;
      }
      const tenMib = 10 * MiB;
      if (size > smallestdisk + tenMib || size < smallestdisk - tenMib) {
        vdev.showDiskSizeError = true;
      }
      if (vdev.disks[i].real_capacity < smallestdisk) {
        smallestdisk = size;
      }
    }
    totalsize = smallestdisk * vdev.disks.length;
    const defaultDraidDataPerGroup = 8;

    if (vdev.type === 'mirror') {
      estimate = smallestdisk;
    } else if (vdev.type === 'raidz') {
      estimate = totalsize - smallestdisk;
    } else if (vdev.type === 'raidz2') {
      estimate = totalsize - 2 * smallestdisk;
    } else if (vdev.type === 'raidz3') {
      estimate = totalsize - 3 * smallestdisk;
    } else if (vdev.type === 'draid1') {
      const dataPerGroup = Math.min(defaultDraidDataPerGroup, vdev.disks.length - 1);
      estimate = vdev.disks.length * (dataPerGroup / (dataPerGroup + 1)) * smallestdisk;
    } else if (vdev.type === 'draid2') {
      const dataPerGroup = Math.min(defaultDraidDataPerGroup, vdev.disks.length - 2);
      estimate = vdev.disks.length * (dataPerGroup / (dataPerGroup + 2)) * smallestdisk;
    } else if (vdev.type === 'draid3') {
      const dataPerGroup = Math.min(defaultDraidDataPerGroup, vdev.disks.length - 3);
      estimate = vdev.disks.length * (dataPerGroup / (dataPerGroup + 3)) * smallestdisk;
    } else {
      estimate = stripeSize; // stripe
    }

    vdev.rawSize = estimate;
  }
}
