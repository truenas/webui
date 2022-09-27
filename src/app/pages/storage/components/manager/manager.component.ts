import {
  AfterViewInit, Component, OnInit, QueryList, ViewChild, ViewChildren,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { SortDirection } from '@angular/material/sort';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import * as filesize from 'filesize';
import * as _ from 'lodash';
import { of } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { DiskBus } from 'app/enums/disk-bus.enum';
import { DiskType } from 'app/enums/disk-type.enum';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { CreatePool, Pool, UpdatePool } from 'app/interfaces/pool.interface';
import { TopologyDisk } from 'app/interfaces/storage.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DownloadKeyDialogComponent } from 'app/modules/common/dialog/download-key/download-key-dialog.component';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { FormParagraphConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ExportedPoolsDialogComponent } from 'app/pages/storage/components/manager/exported-pools-dialog/exported-pools-dialog.component';
import { DialogService, WebSocketService } from 'app/services';
import { StorageService } from 'app/services/storage.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';
import { ManagerDisk } from './manager-disk.interface';
import { VdevComponent } from './vdev/vdev.component';

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
  vdevs: any = {
    data: [{}], cache: [], spares: [], log: [], special: [], dedup: [],
  };
  originalDisks: ManagerDisk[] = [];
  originalSuggestableDisks: ManagerDisk[] = [];
  error: string;
  @ViewChildren(VdevComponent) vdevComponents: QueryList<VdevComponent>;
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  // TODO: Rename to something more readable
  temp: ManagerDisk[] = [];

  nameControl = new FormControl('', Validators.required);
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
  loaderOpen = false;
  help = helptext;
  exportedPoolsWarnings: string[] = [];

  submitTitle: string = this.translate.instant('Create');
  protected extendedSubmitTitle: string = this.translate.instant('Add Vdevs');

  protected needsDisk = true;
  protected needsDiskMessage = helptext.manager_needsDiskMessage;
  protected extendedNeedsDiskMessage = helptext.manager_extendedNeedsDiskMessage;
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
    public mdDialog: MatDialog,
    public translate: TranslateService,
    public sorter: StorageService,
    private store$: Store<AppState>,
  ) {}

  duplicate(): void {
    const duplicableDisks = this.duplicableDisks;
    let maxVdevs = 0;
    if (this.firstDataVdevDisknum && this.firstDataVdevDisknum > 0) {
      maxVdevs = Math.floor(this.duplicableDisks.length / this.firstDataVdevDisknum);
    }
    const vdevsOptions = [];
    for (let i = maxVdevs; i > 0; i--) {
      vdevsOptions.push({ label: String(i), value: i });
    }
    const conf: DialogFormConfiguration = {
      title: helptext.manager_duplicate_title,
      fieldConfig: [
        {
          type: 'select',
          name: 'vdevs',
          value: maxVdevs,
          placeholder: helptext.manager_duplicate_vdevs_placeholder,
          tooltip: helptext.manager_duplicate_vdevs_tooltip,
          options: vdevsOptions,
        },
        {
          type: 'paragraph',
          name: 'copy_desc',
          paraText: '',
        },
      ],

      saveButtonText: helptext.manager_duplicate_button,
      customSubmit: (entityDialog: EntityDialogComponent) => {
        const value = entityDialog.formValue;
        const origVdevs = this.vdevComponents.toArray();
        // handle case of extending with zero vdevs filled out
        if (origVdevs.length === 1 && origVdevs[0].disks.length === 0) {
          const vdev = origVdevs[0];
          value.vdevs = value.vdevs - 1;
          for (let i = 0; i < this.firstDataVdevDisknum; i++) {
            const disk = duplicableDisks.shift();
            vdev.addDisk(disk);
            this.removeDisk(disk);
          }
        }
        for (let i = 0; i < value.vdevs; i++) {
          const vdevValues = { disks: [] as ManagerDisk[], type: this.firstDataVdevType };
          for (let n = 0; n < this.firstDataVdevDisknum; n++) {
            const duplicateDisk = duplicableDisks.shift();
            vdevValues.disks.push(duplicateDisk);
            // remove disk from selected
            this.selected = _.remove(this.selected, (disk) => disk.devname !== duplicateDisk.devname);
          }
          this.addVdev('data', vdevValues);
        }
        entityDialog.dialogRef.close(true);
        setTimeout(() => {
          this.getCurrentLayout();
        }, 500);
      },
      afterInit: (entityDialog: EntityDialogComponent) => {
        const copyDesc = _.find(entityDialog.fieldConfig, { name: 'copy_desc' }) as FormParagraphConfig;
        const setParatext = (vdevs: number): void => {
          const used = this.firstDataVdevDisknum * vdevs;
          const remaining = this.duplicableDisks.length - used;
          const size = filesize(this.firstDataVdevDisksize, { standard: 'iec' });
          const type = this.firstDataVdevDisktype;
          const vdevType = this.firstDataVdevType;
          copyDesc.paraText = this.translate.instant(
            'Create {vdevs} new {vdevType} data vdevs using {used} ({size}) {type}s and leaving {remaining} of those drives unused.',
            {
              vdevs, vdevType, size, used, type, remaining,
            },
          );
        };
        setParatext(entityDialog.formGroup.controls['vdevs'].value);
        entityDialog.formGroup.controls['vdevs'].valueChanges.pipe(untilDestroyed(this)).subscribe((vdevs) => {
          setParatext(vdevs);
        });
      },
    };
    this.dialog.dialogForm(conf);
  }

  handleError = (error: WebsocketError | Job<null, unknown[]>): void => {
    this.dialog.errorReportMiddleware(error);
  };

  getDiskNumErrorMsg(disks: number): void {
    this.disknumError = `${this.translate.instant(this.disknumErrorMessage)} ${this.translate.instant('First vdev has {n} disks, new vdev has {m}', { n: this.firstDataVdevDisknum, m: disks })}`;
  }

  getVdevTypeErrorMsg(type: string): void {
    this.vdevtypeError = `${this.translate.instant(this.vdevtypeErrorMessage)} ${this.translate.instant('First vdev is a {vdevType}, new vdev is {newVdevType}', { vdevType: this.firstDataVdevType, newVdevType: type })}`;
  }

  getStripeVdevTypeErrorMsg(group: string): void {
    const vdevType = group === 'special' ? 'metadata' : group;
    this.stripeVdevTypeError = this.translate.instant('A stripe {vdevType} vdev is highly discouraged and will result in data loss if it fails', { vdevType });
  }

  getLogVdevTypeWarningMsg(): void {
    this.logVdevTypeWarning = this.translate.instant('A stripe log vdev may result in data loss if it fails combined with a power outage.');
  }

  getPoolData(): void {
    this.ws.call(this.queryCall, [[['id', '=', this.pk]]]).pipe(untilDestroyed(this)).subscribe({
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
        this.ws.call('disk.query', [[['name', '=', firstDisk.disk]]]).pipe(untilDestroyed(this)).subscribe({
          next: (disk) => {
            if (disk[0]) {
              this.firstDataVdevDisksize = disk[0].size;
              this.firstDataVdevDisktype = disk[0].type;
            }
            this.getDuplicableDisks();
          },
          error: this.handleError,
        });
        this.nameControl.setValue(searchedPools[0].name);
        this.volEncrypt = searchedPools[0].encrypt;
        this.ws.call(this.datasetQueryCall, [[['id', '=', searchedPools[0].name]]]).pipe(untilDestroyed(this)).subscribe({
          next: (datasets) => {
            if (datasets[0]) {
              this.extendedAvailable = datasets[0].available.parsed;
              this.size = filesize(this.extendedAvailable, { standard: 'iec' });
            }
          },
          error: this.handleError,
        });
      },
      error: this.handleError,
    });
  }

  ngOnInit(): void {
    this.ws.call('pool.dataset.encryption_algorithm_choices').pipe(untilDestroyed(this)).subscribe({
      next: (algorithms) => {
        for (const algorithm in algorithms) {
          if (algorithms.hasOwnProperty(algorithm)) {
            this.encryptionAlgorithmOptions.push({ label: algorithm, value: algorithm });
          }
        }
      },
      error: this.handleError,
    });
    this.store$.pipe(waitForAdvancedConfig, untilDestroyed(this)).subscribe({
      next: (config) => {
        this.swapondrive = config.swapondrive;
      },
      error: this.handleError,
    });
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      if (params['poolId']) {
        this.pk = parseInt(params['poolId'], 10);
        this.isNew = false;
      }
    });
    this.size = filesize(0, { standard: 'iec' });
    if (!this.isNew) {
      this.submitTitle = this.extendedSubmitTitle;
      this.sizeMessage = this.extendedSizeMessage;
      this.getPoolData();
    } else {
      this.ws.call(this.queryCall, []).pipe(untilDestroyed(this)).subscribe({
        next: (pools) => {
          if (pools) {
            this.existingPools = pools;
          }
        },
        error: this.handleError,
      });
    }
    this.nameFilter = new RegExp('');
    this.capacityFilter = new RegExp('');
  }

  ngAfterViewInit(): void {
    this.loader.open();
    this.loaderOpen = true;
    this.ws.call('disk.get_unused', []).pipe(untilDestroyed(this)).subscribe({
      next: (unusedDisks) => {
        this.loader.close();
        this.loaderOpen = false;
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
      error: (error) => {
        this.loader.close();
        this.handleError(error);
      },
    });
  }

  addVdev(group: string, initialValues = {}): void {
    this.dirty = true;
    this.vdevs[group].push(initialValues);
    setTimeout(() => { // there appears to be a slight race condition with adding/removing
      this.getCurrentLayout();
    }, 100);
  }

  removeVdev(vdev: VdevComponent): void {
    let index = null;
    this.vdevComponents.forEach((item, i) => {
      if (item === vdev) {
        index = i;
      }
    });
    if (index !== null) {
      if (vdev.group === 'data') {
        this.vdevs[vdev.group].splice(index, 1);
      } else {
        this.vdevs[vdev.group] = []; // should only be one cache/spare/log
      }
    }
    setTimeout(() => { // there appears to be a slight race condition with adding/removing
      this.getCurrentLayout();
    }, 100);
  }

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

    (this.vdevComponents || []).forEach((vdev, i) => {
      if (vdev.group === 'data') {
        if (i === 0 && this.isNew) {
          this.firstDataVdevType = vdev.typeControl.value;
          dataVdevType = vdev.typeControl.value;
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
          dataVdevType = vdev.typeControl.value;
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
      if (['dedup', 'log', 'special', 'data'].includes(vdev.group)) {
        if (vdev.disks.length >= 1 && vdev.typeControl.value.toLowerCase() === 'stripe') {
          if (vdev.group === 'log') {
            this.getLogVdevTypeWarningMsg();
          } else {
            this.getStripeVdevTypeErrorMsg(vdev.group);
          }

          this.hasSavableErrors = true;
        }
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
    if (this.isNew && !this.nameControl.value) {
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
      warnings = warnings + '<br/><br/>' + helptext.force_warnings['diskSizeWarning'];
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
      buttonMsg: confirmButton,
    })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.error = null;

        const layout: any = {};
        this.vdevComponents.forEach((vdev) => {
          const disks: string[] = [];
          vdev.getDisks().forEach((disk) => {
            if (disk.duplicate_serial?.length) {
              allowDuplicateSerials = true;
            }
            disks.push(disk.devname);
          });
          if (disks.length > 0) {
            let type = vdev.typeControl.value.toUpperCase();
            type = type === 'RAIDZ' ? 'RAIDZ1' : type;
            const group = vdev.group;
            if (!layout[group]) {
              layout[group] = [];
            }
            if (group === 'spares') {
              layout[group] = disks;
            } else {
              layout[group].push({ type, disks });
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
            (body as CreatePool)['encryption_options'] = { generate_key: true, algorithm: this.encryptionAlgorithmControl.value };
          }
        } else {
          body = { topology: layout } as UpdatePool;
        }

        if (allowDuplicateSerials) {
          body['allow_duplicate_serials'] = true;
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
                const downloadDialogRef = this.mdDialog.open(DownloadKeyDialogComponent, { disableClose: true });
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
              error: this.handleError,
              complete: () => {
                dialogRef.close(false);
                this.goBack();
              },
            },
          );
        dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe({
          next: (error) => {
            dialogRef.close(false);
            this.handleError(error);
          },
          error: this.handleError,
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
        buttonMsg: this.translate.instant('I Understand'),
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

  removeDisk(disk: ManagerDisk): void {
    this.disks.splice(this.disks.indexOf(disk), 1);
    this.disks = [...this.disks];
    this.temp.splice(this.temp.indexOf(disk), 1);
    this.dirty = true;
    this.getCurrentLayout();
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
    this.vdevComponents.forEach((vdev) => {
      vdev.remove();
    });
    for (const group in this.vdevs) {
      if (this.vdevs.hasOwnProperty(group)) {
        while (this.vdevs[group].length > 0) {
          this.vdevs[group].pop();
        }
      }
    }
    this.nameFilter = new RegExp('');
    this.capacityFilter = new RegExp('');
    this.vdevs['data'].push({});
    this.vdevComponents.first.estimateSize();
    this.disks = Array.from(this.originalDisks);
    this.suggestableDisks = Array.from(this.originalSuggestableDisks);
    this.temp = [...this.disks];
    this.dirty = false;
    this.table.offset = 0;
    this.getCurrentLayout();
  }

  suggestRedundancyLayout(): void {
    this.selected = [];
    const exportedPoolsDisks: ManagerDisk[] = [];
    this.suggestableDisks.forEach((disk) => {
      if (disk.exported_zpool) {
        exportedPoolsDisks.push(disk);
      }
      this.vdevComponents.first.addDisk(disk);
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

  toggleExpandRow(row: any): void {
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
}
