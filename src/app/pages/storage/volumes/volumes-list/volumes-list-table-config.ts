import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog/dialog-ref';
import { Router } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { TreeNode } from 'primeng/api';
import { forkJoin, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DatasetEncryptionType } from 'app/enums/dataset-encryption-type.enum';
import { DatasetType } from 'app/enums/dataset-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolScrubAction } from 'app/enums/pool-scrub-action.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import helptext from 'app/helptext/storage/volumes/volume-list';
import { DatasetLockParams } from 'app/interfaces/dataset-lock.interface';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Job } from 'app/interfaces/job.interface';
import { DatasetAttachment } from 'app/interfaces/pool-attachment.interface';
import { Pool, PoolExpandParams, UpdatePool } from 'app/interfaces/pool.interface';
import { Process } from 'app/interfaces/process.interface';
import { Subs } from 'app/interfaces/subs.interface';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { FormUploadComponent } from 'app/modules/entity/entity-form/components/form-upload/form-upload.component';
import { MessageService } from 'app/modules/entity/entity-form/services/message.service';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import {
  CreateSnapshotDialogComponent,
} from 'app/pages/storage/volumes/create-snapshot-dialog/create-snapshot-dialog.component';
import {
  DeleteDatasetDialogComponent,
} from 'app/pages/storage/volumes/delete-dataset-dialog/delete-dataset-dialog.component';
import { DeleteZvolDialogComponent } from 'app/pages/storage/volumes/delete-zvol-dialog/delete-zvol-dialog.component';
import {
  EncryptionOptionsDialogComponent,
} from 'app/pages/storage/volumes/encyption-options-dialog/encryption-options-dialog.component';
import { ExportDisconnectModalComponent, ExportDisconnectModalState } from 'app/pages/storage/volumes/volumes-list/components/export-disconnect-modal.component';
import {
  VolumesListDataset,
  VolumesListPool,
} from 'app/pages/storage/volumes/volumes-list/volumes-list-pool.interface';
import { VolumesListComponent } from 'app/pages/storage/volumes/volumes-list/volumes-list.component';
import {
  AppLoaderService, DialogService, StorageService, ValidationService, WebSocketService,
} from 'app/services';

export class VolumesListTableConfig implements EntityTableConfig {
  hideTopActions = true;
  tableData: TreeNode[] = [];
  columns = [
    { name: T('Name'), prop: 'name', always_display: true },
    { name: T('Type'), prop: 'type', hidden: false },
    {
      name: T('Used'), prop: 'used_parsed', sortBy: 'used.parsed', filesizePipe: false, hidden: false,
    },
    {
      name: T('Available'), prop: 'available_parsed', hidden: false, filesizePipe: false,
    },
    { name: T('Compression'), prop: 'compression' },
    { name: T('Compression Ratio'), prop: 'compressratio' },
    { name: T('Readonly'), prop: 'readonly', hidden: false },
    { name: T('Dedup'), prop: 'dedup' },
    { name: T('Comments'), prop: 'comments' },
    { name: T('Actions'), prop: 'actions', hidden: false },
  ];

  config = {
    deleteMsg: {
      key_props: ['name'],
    },
  };

  protected dialogRef: MatDialogRef<EntityJobComponent>;
  routeAdd = ['storage', 'import'];
  routeAddTooltip = T('Create or Import Pool');
  showSpinner: boolean;
  // TODO: Unused?
  encryptedStatus: number;
  restartServices = false;
  subs: Subs;
  productType = window.localStorage.getItem('product_type') as ProductType;

  constructor(
    private parentVolumesListComponent: VolumesListComponent,
    private router: Router,
    private classId: string,
    private datasets: Dataset[],
    public mdDialog: MatDialog,
    protected ws: WebSocketService,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected translate: TranslateService,
    protected storageService: StorageService,
    protected volumeData: VolumesListPool,
    protected messageService: MessageService,
    protected http: HttpClient,
    protected validationService: ValidationService,
  ) {
    if (typeof (this.classId) !== 'undefined' && this.classId !== '' && volumeData && volumeData['children']) {
      this.tableData = volumeData['children'].map((child) => {
        child.parent = volumeData;
        return this.dataHandler(child);
      });
    }
  }

  destroy(): void {
    console.info(`The ${this.constructor.name} has been destroyed`);
  }

  isCustActionVisible(actionname: string): boolean {
    if (actionname === 'download_key' && this.encryptedStatus > 0) {
      return true;
    }
    return false;
  }

  getEncryptedActions(rowData: VolumesListPool): EntityTableAction[] {
    const actions = [];

    if (this.parentVolumesListComponent.hasEncryptedRoot[rowData.name]
      && this.parentVolumesListComponent.hasKeyDataset[rowData.name]) {
      actions.push({
        label: T('Export Dataset Keys'),
        onClick: (row1: VolumesListPool) => {
          this.loader.open();
          const fileName = 'dataset_' + row1.name + '_keys.json';
          const mimetype = 'application/json';
          this.ws.call('core.download', ['pool.dataset.export_keys', [row1.name], fileName]).pipe(untilDestroyed(this, 'destroy')).subscribe((res) => {
            this.loader.close();
            const url = res[1];
            this.storageService.streamDownloadFile(this.http, url, fileName, mimetype)
              .pipe(untilDestroyed(this, 'destroy'))
              .subscribe((file) => {
                if (res !== null && (res as any) !== '') {
                  this.storageService.downloadBlob(file, fileName);
                }
              });
          }, (error) => {
            this.loader.close();
            new EntityUtils().handleWsError(this, error, this.dialogService);
          });
        },
      });
    }

    return actions as EntityTableAction[];
  }

  keyFileUpdater(file: FormUploadComponent): void {
    const fileBrowser = file.fileInput.nativeElement;
    if (fileBrowser.files && fileBrowser.files[0]) {
      this.subs = { apiEndPoint: file.apiEndPoint, file: fileBrowser.files[0] };
    }
  }

  getPoolData(poolId: number): Observable<Pool[]> {
    return this.ws.call('pool.query', [[['id', '=', poolId]]]);
  }

  getActions(rowData: VolumesListPool | VolumesListDataset): EntityTableAction[] {
    (rowData as any).is_passphrase = (!!('key_format' in rowData && rowData.key_format.parsed === 'passphrase'));
    let rowDataPathSplit: string[] = [];
    if ('mountpoint' in rowData && rowData.mountpoint) {
      rowDataPathSplit = rowData.mountpoint.split('/');
    }
    const actions = [];
    // workaround to make deleting volumes work again,  was if (row.vol_fstype == "ZFS")
    if (rowData.type === 'zpool') {
      if (rowData.status !== PoolStatus.Offline) {
        actions.push({
          id: rowData.name,
          name: T('Pool Options'),
          label: T('Pool Options'),
          onClick: (row: VolumesListPool) => {
            const dialogConf: DialogFormConfiguration = {
              title: this.translate.instant('Edit Pool Options for {name}', { name: row.name }),
              confirmCheckbox: true,
              fieldConfig: [
                {
                  type: 'checkbox',
                  name: 'autotrim',
                  placeholder: helptext.pool_options_dialog.autotrim_placeholder,
                  tooltip: helptext.pool_options_dialog.autotrim_tooltip,
                  value: (row.autotrim.value === 'on'),
                },
              ],
              saveButtonText: helptext.encryption_options_dialog.save_button,
              afterInit() {
              },
              customSubmit: (entityDialog: EntityDialogComponent) => {
                const formValue = entityDialog.formValue;
                const dialogRef = this.mdDialog.open(EntityJobComponent, {
                  data: { title: helptext.pool_options_dialog.save_pool_options },
                  disableClose: true,
                });
                dialogRef.componentInstance.setDescription(helptext.pool_options_dialog.saving_pool_options);
                dialogRef.componentInstance.setCall('pool.update', [
                  row.id,
                  { autotrim: formValue.autotrim ? OnOff.On : OnOff.Off } as UpdatePool,
                ]);
                dialogRef.componentInstance.submit();
                dialogRef.componentInstance.success.pipe(untilDestroyed(this, 'destroy')).subscribe((res: Job<Pool>) => {
                  if (res) {
                    dialogRef.close();
                    entityDialog.dialogRef.close();
                    this.dialogService.info(
                      helptext.pool_options_dialog.dialog_saved_title,
                      this.translate.instant('Pool options for {poolName} successfully saved.', { poolName: row.name }),
                      '500px', 'info',
                    );
                    this.parentVolumesListComponent.repaintMe();
                  }
                });
                dialogRef.componentInstance.failure.pipe(untilDestroyed(this, 'destroy')).subscribe((err) => {
                  if (err) {
                    dialogRef.close();
                    new EntityUtils().handleWsError(entityDialog, err, this.dialogService);
                  }
                });
              },
            };
            this.dialogService.dialogForm(dialogConf).pipe(untilDestroyed(this, 'destroy')).subscribe(() => {
            });
          },
        });
      }
      actions.push({
        id: rowData.name,
        name: 'Export/Disconnect',
        label: helptext.exportAction,
        color: 'warn',
        onClick: (row1: VolumesListPool) => {
          if (rowData.status !== PoolStatus.Unknown) {
            this.loader.open();
            forkJoin([
              this.ws.call('pool.attachments', [row1.id]),
              this.ws.call('pool.processes', [row1.id]),
              this.ws.call('systemdataset.config'),
            ]).pipe(
              untilDestroyed(this, 'destroy'),
            ).subscribe(([attachments, processes, systemConfig]) => {
              this.loader.close();

              this.openDetachModal(row1, attachments, processes, systemConfig)
                .pipe(
                  filter(Boolean),
                  untilDestroyed(this, 'destroy'),
                )
                .subscribe(() => {
                  this.parentVolumesListComponent.repaintMe();
                });
            },
            (err) => {
              this.loader.close();
              this.dialogService.errorReport(helptext.exportError, err.reason, err.trace.formatted);
            });
          } else {
            this.openDetachModal(row1)
              .pipe(
                filter(Boolean),
                untilDestroyed(this, 'destroy'),
              )
              .subscribe(() => {
                this.parentVolumesListComponent.repaintMe();
              });
          }
        },
      });

      if (rowData.status !== PoolStatus.Offline) {
        actions.push({
          id: rowData.name,
          name: 'Add Vdevs',
          label: T('Add Vdevs'),
          onClick: (row1: VolumesListPool) => {
            this.router.navigate(['/', 'storage', 'manager', row1.id]);
          },
        });
        actions.push({
          id: rowData.name,
          name: 'Scrub Pool',
          label: T('Scrub Pool'),
          onClick: (row1: VolumesListPool) => {
            this.getPoolData(row1.id).pipe(untilDestroyed(this, 'destroy')).subscribe((pools) => {
              if (!pools[0]) {
                return;
              }

              if (pools[0].scan.function === PoolScanFunction.Scrub && pools[0].scan.state === PoolScanState.Scanning) {
                const message = this.translate.instant('Stop the scrub on {poolName}?', { poolName: row1.name });
                this.dialogService.confirm({
                  message,
                  title: this.translate.instant('Scrub Pool'),
                  buttonMsg: this.translate.instant('Stop Scrub'),
                }).pipe(
                  filter(Boolean),
                  untilDestroyed(this, 'destroy'),
                ).subscribe(() => {
                  this.loader.open();
                  this.ws.call('pool.scrub', [row1.id, PoolScrubAction.Stop]).pipe(untilDestroyed(this, 'destroy')).subscribe(
                    () => {
                      this.loader.close();
                      const msg = this.translate.instant('Stopping scrub on pool');
                      this.dialogService.info(T('Stop Scrub'), `${msg} <i>${row1.name}</i>`, '300px', 'info', true);
                    },
                    (err) => {
                      this.loader.close();
                      new EntityUtils().handleWsError(this, err, this.dialogService);
                    },
                  );
                });
              } else {
                const message = this.translate.instant('Start scrub on pool <i>{poolName}</i>?', { poolName: row1.name });
                this.dialogService.confirm({
                  message,
                  title: this.translate.instant('Scrub Pool'),
                  buttonMsg: this.translate.instant('Start Scrub'),
                }).pipe(
                  filter(Boolean),
                  untilDestroyed(this, 'destroy'),
                ).subscribe(() => {
                  this.dialogRef = this.mdDialog.open(EntityJobComponent, {
                    data: { title: T('Scrub Pool') },
                  });
                  this.dialogRef.componentInstance.setCall('pool.scrub', [row1.id, PoolScrubAction.Start]);
                  this.dialogRef.componentInstance.submit();
                  this.dialogRef.componentInstance.success.pipe(untilDestroyed(this, 'destroy')).subscribe((jobres) => {
                    this.dialogRef.close(false);
                    if (jobres.progress.percent === 100 && jobres.progress.description === 'Scrub finished') {
                      this.dialogService.info(
                        this.translate.instant('Scrub Complete'),
                        this.translate.instant('Scrub complete on pool <i>{poolName}</i>.', { poolName: row1.name }),
                        '300px',
                        'info',
                        true,
                      );
                    } else {
                      this.dialogService.info(
                        this.translate.instant('Scrub Stopped'),
                        this.translate.instant('Stopped the scrub on pool <i>{poolName}</i>.', { poolName: row1.name }),
                        '300px',
                        'info',
                        true,
                      );
                    }
                  });
                  this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this, 'destroy')).subscribe((err) => {
                    this.dialogRef.componentInstance.setDescription(err.error);
                  });
                });
              }
            });
          },
        });
        actions.push({
          id: rowData.name,
          name: 'Status',
          label: T('Status'),
          onClick: (row1: VolumesListPool) => {
            this.router.navigate(['/', 'storage', 'status', row1.id]);
          },
        });
        actions.push({
          id: rowData.name,
          name: T('Expand Pool'),
          label: T('Expand Pool'),
          onClick: (row1: VolumesListPool) => {
            const conf: DialogFormConfiguration = {
              title: helptext.expand_pool_dialog.title + row1.name,
              fieldConfig: [
                {
                  type: 'paragraph',
                  name: 'expand_description',
                  paraText: helptext.expand_pool_dialog.message,
                },
                {
                  type: 'input',
                  inputType: 'password',
                  name: 'passphrase',
                  placeholder: helptext.expand_pool_dialog.passphrase_placeholder,
                  togglePw: true,
                  required: true,
                },
              ],
              saveButtonText: helptext.expand_pool_dialog.save_button,
              customSubmit(entityDialog: EntityDialogComponent) {
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                doExpand(entityDialog);
              },
            };

            const doExpand = (entityDialog?: EntityDialogComponent): void => {
              this.loader.open();
              const payload: PoolExpandParams = [row1.id];
              if (entityDialog) {
                payload.push({ geli: { passphrase: entityDialog.formValue['passphrase'] } });
              }
              this.ws.job('pool.expand', payload).pipe(untilDestroyed(this, 'destroy')).subscribe(
                (res) => {
                  this.loader.close();
                  if (res.error) {
                    if (res.exc_info && res.exc_info.extra) {
                      (res as any).extra = res.exc_info.extra;
                    }
                    new EntityUtils().handleWsError(this, res, this.dialogService, conf.fieldConfig);
                  }
                  if (res.state === JobState.Success) {
                    if (entityDialog) {
                      entityDialog.dialogRef.close(true);
                    }
                    this.dialogService.generalDialog({
                      title: helptext.expand_pool_success_dialog.title,
                      icon: 'info',
                      is_html: true,
                      message: this.translate.instant('Successfully expanded pool <i>{poolName}</i>', { poolName: row1.name }),
                      hideCancel: true,
                    });
                  }
                },
                (err) => {
                  this.loader.close();
                  new EntityUtils().handleWsError(this, err, this.dialogService);
                },
              );
            };

            this.dialogService.generalDialog({
              title: this.translate.instant(helptext.expand_pool_dialog.title) + row1.name,
              message: helptext.expand_pool_dialog.message,
              confirmBtnMsg: helptext.expand_pool_dialog.save_button,
            }).pipe(
              filter(Boolean),
              untilDestroyed(this, 'destroy'),
            ).subscribe(() => doExpand());
          },
        });

        if (!rowData.is_upgraded) {
          actions.push({
            id: rowData.name,
            name: T('Upgrade Pool'),
            label: T('Upgrade Pool'),
            onClick: (row1: VolumesListPool) => {
              this.dialogService.confirm({
                title: this.translate.instant('Upgrade Pool'),
                message: this.translate.instant(helptext.upgradePoolDialog_warning) + row1.name,
              }).pipe(
                filter(Boolean),
                untilDestroyed(this, 'destroy'),
              ).subscribe(() => {
                this.loader.open();
                this.ws.call('pool.upgrade', [rowData.id]).pipe(untilDestroyed(this, 'destroy')).subscribe(
                  () => {
                    this.dialogService.info(
                      this.translate.instant('Upgraded'),
                      this.translate.instant('Successfully Upgraded {poolName}.', { poolName: row1.name }),
                      '500px',
                      'info',
                    ).pipe(untilDestroyed(this)).subscribe(() => {
                      this.parentVolumesListComponent.repaintMe();
                    });
                  },
                  (res) => {
                    this.dialogService.errorReport(
                      this.translate.instant('Error Upgrading Pool {poolName}', { poolName: row1.name }),
                      res.message,
                      res.stack,
                    );
                  },
                  () => this.loader.close(),
                );
              });
            },
          });
        }
      }
    }

    if (rowData.type === DatasetType.Filesystem) {
      if (!rowData.locked) {
        actions.push({
          id: rowData.name,
          name: T('Add Dataset'),
          label: T('Add Dataset'),
          onClick: () => {
            this.parentVolumesListComponent.addDataset(rowData.pool, rowData.id);
          },
        });
        actions.push({
          id: rowData.name,
          name: T('Add Zvol'),
          label: T('Add Zvol'),
          onClick: () => {
            this.parentVolumesListComponent.addZvol(rowData.id, true);
          },
        });
      }
      actions.push({
        id: rowData.name,
        name: T('Edit Options'),
        label: T('Edit Options'),
        onClick: () => {
          this.parentVolumesListComponent.editDataset(rowData.pool, rowData.id);
        },
      });
      if (rowDataPathSplit[1] !== 'iocage' && !rowData.locked) {
        actions.push({
          id: rowData.name,
          name: T('View Permissions'),
          label: T('View Permissions'),
          ttposition: 'left',
          onClick: (row: VolumesListDataset) => {
            this.parentVolumesListComponent.viewingPermissionsForDataset = row;
          },
        },
        {
          id: rowData.name,
          name: T('User Quotas'),
          label: T('User Quotas'),
          onClick: () => {
            this.router.navigate(['/', 'storage', 'user-quotas', rowData.id]);
          },
        },
        {
          id: rowData.name,
          name: T('Group Quotas'),
          label: T('Group Quotas'),
          onClick: () => {
            this.router.navigate(['/', 'storage', 'group-quotas', rowData.id]);
          },
        });
      }

      if (rowData.id.includes('/')) {
        actions.push({
          id: rowData.name,
          name: T('Delete Dataset'),
          label: T('Delete Dataset'),
          onClick: (row: VolumesListDataset) => {
            this.mdDialog.open(DeleteDatasetDialogComponent, { data: row })
              .afterClosed()
              .pipe(untilDestroyed(this, 'destroy'))
              .subscribe((shouldRefresh) => {
                if (shouldRefresh) {
                  this.parentVolumesListComponent.repaintMe();
                }
              });
          },
        });
      }
    }
    if (rowData.type === DatasetType.Volume) {
      actions.push({
        id: rowData.name,
        name: T('Delete Zvol'),
        label: T('Delete Zvol'),
        onClick: (row: VolumesListDataset) => {
          this.mdDialog.open(DeleteZvolDialogComponent, { data: row })
            .afterClosed()
            .pipe(untilDestroyed(this, 'destroy'))
            .subscribe((shouldRefresh) => {
              if (shouldRefresh) {
                this.parentVolumesListComponent.repaintMe();
              }
            });
        },
      });
      actions.push({
        id: rowData.name,
        name: T('Edit Zvol'),
        label: T('Edit Zvol'),
        onClick: () => {
          this.parentVolumesListComponent.addZvol(rowData.id, false);
        },
      });
    }
    if (rowData.type === DatasetType.Volume || rowData.type === DatasetType.Filesystem) {
      actions.push({
        id: rowData.name,
        name: T('Create Snapshot'),
        label: T('Create Snapshot'),
        onClick: (row: VolumesListDataset) => {
          this.mdDialog.open(CreateSnapshotDialogComponent, {
            data: row.id,
          });
        },
      });

      const rowDataset = _.find(this.datasets, { id: rowData.id });
      if (rowDataset && rowDataset['origin'] && !!rowDataset['origin'].parsed) {
        actions.push({
          id: rowData.name,
          name: T('Promote Dataset'),
          label: T('Promote Dataset'),
          onClick: (row1: VolumesListDataset) => {
            this.loader.open();

            this.ws.call('pool.dataset.promote', [row1.id]).pipe(untilDestroyed(this, 'destroy')).subscribe(() => {
              this.loader.close();
              // Showing info here because there is no feedback on list parent for this if promoted.
              this.dialogService
                .info(T('Promote Dataset'), T('Successfully Promoted ') + row1.id, '500px', 'info')
                .pipe(untilDestroyed(this, 'destroy'))
                .subscribe(() => {
                  this.parentVolumesListComponent.repaintMe();
                });
            }, (res) => {
              this.loader.close();
              const msg = this.translate.instant('Error Promoting dataset ');
              this.dialogService.errorReport(msg + row1.id, res.reason, res.stack);
            });
          },
        });
      }
    }
    return actions as EntityTableAction[];
  }

  private openDetachModal(
    pool: VolumesListPool,
    attachments?: DatasetAttachment[],
    processes?: Process[],
    systemConfig?: SystemDatasetConfig,
  ): Observable<unknown> {
    return this.mdDialog
      .open(ExportDisconnectModalComponent, {
        width: '550px',
        disableClose: true,
        data: {
          pool,
          attachments,
          processes,
          systemConfig,
        } as ExportDisconnectModalState,
      })
      .afterClosed();
  }

  getEncryptedDatasetActions(rowData: VolumesListDataset): EntityTableAction[] {
    const encryptionActions = [];
    if (rowData.encrypted) {
      if (rowData.locked) {
        if (rowData.is_encrypted_root
          && (!rowData.parent || (rowData.parent && !(rowData.parent as VolumesListDataset).locked))) {
          encryptionActions.push({
            id: rowData.name,
            name: T('Unlock'),
            label: T('Unlock'),
            onClick: () => {
              // unlock
              this.router.navigate([
                '/', 'storage', 'id', rowData.pool, 'dataset',
                'unlock', rowData.id,
              ]);
            },
          });
        }
      } else {
        encryptionActions.push({
          id: rowData.name,
          name: T('Encryption Options'),
          label: T('Encryption Options'),
          onClick: (row: VolumesListDataset) => {
            const hasKeyChild = this.datasets.some((dataset) => {
              return dataset.id.startsWith(row.id) && dataset.id !== row.id
                && dataset.encryption_root && (dataset.id === dataset.encryption_root)
                && dataset.key_format?.value === 'HEX';
            });
            const parent = row.parent as VolumesListDataset;
            const hasPassphraseParent = parent?.key_format?.value === DatasetEncryptionType.Passphrase;

            this.mdDialog.open(
              EncryptionOptionsDialogComponent,
              { data: { row, hasKeyChild, hasPassphraseParent } },
            )
              .afterClosed()
              .pipe(untilDestroyed(this, 'destroy'))
              .subscribe((shouldRefresh) => {
                if (shouldRefresh) {
                  this.parentVolumesListComponent.repaintMe();
                }
              });
          },
        });
        if (rowData.is_encrypted_root && rowData.is_passphrase) {
          encryptionActions.push({
            id: rowData.name,
            name: T('Lock'),
            label: T('Lock'),
            onClick: (row: VolumesListDataset) => {
              const datasetName = row.name;
              const params: DatasetLockParams = [row.id];
              let forceUmount = false;
              const ds = this.dialogService.confirm({
                title: this.translate.instant('Lock Dataset {datasetName}', { datasetName }),
                message: this.translate.instant('Lock Dataset {datasetName}?', { datasetName }),
                buttonMsg: this.translate.instant('Lock'),
                secondaryCheckBox: true,
                secondaryCheckBoxMsg: this.translate.instant('Force unmount'),
                method: 'pool.dataset.lock',
                data: params,
              });
              ds.componentInstance.switchSelectionEmitter.pipe(untilDestroyed(this, 'destroy')).subscribe((res: boolean) => {
                forceUmount = res;
              });
              ds.afterClosed().pipe(
                filter(Boolean),
                untilDestroyed(this, 'destroy'),
              ).subscribe(() => {
                const dialogRef = this.mdDialog.open(EntityJobComponent, {
                  data: { title: helptext.lock_dataset_dialog.locking_dataset },
                  disableClose: true,
                });
                dialogRef.componentInstance.setDescription(
                  this.translate.instant('Locking dataset {datasetName}', { datasetName: rowData.name }),
                );
                params.push({ force_umount: forceUmount });
                dialogRef.componentInstance.setCall(ds.componentInstance.method, params);
                dialogRef.componentInstance.submit();
                let done = false;
                dialogRef.componentInstance.success.pipe(untilDestroyed(this, 'destroy')).subscribe(() => {
                  if (!done) {
                    dialogRef.close(false);
                    done = true;
                    this.parentVolumesListComponent.repaintMe();
                  }
                });

                dialogRef.componentInstance.failure.pipe(untilDestroyed(this, 'destroy')).subscribe((res) => {
                  dialogRef.close(false);
                  new EntityUtils().handleWsError(this, res, this.dialogService);
                });
              });
            },
          });
        }
        if (
          rowData.encrypted
          && rowData.key_loaded
          && rowData.encryption_root === rowData.id
          && !rowData.is_passphrase
        ) {
          const fileName = 'dataset_' + rowData.name + '_key.json';
          const mimetype = 'application/json';
          encryptionActions.push({
            id: rowData.id,
            name: T('Export Key'),
            label: T('Export Key'),
            onClick: () => {
              const dialogRef = this.mdDialog.open(EntityJobComponent, {
                data: { title: T('Retrieving Key') },
                disableClose: true,
              });
              dialogRef.componentInstance.setCall('pool.dataset.export_key', [rowData.id]);
              dialogRef.componentInstance.submit();
              dialogRef.componentInstance.success.pipe(untilDestroyed(this, 'destroy')).subscribe((res: Job<string>) => {
                dialogRef.close();
                this.dialogService.confirm({
                  title: this.translate.instant('Key for {id}', { id: rowData.id }),
                  message: res.result + '<br/><br/>' + this.translate.instant('WARNING: Only the key for the dataset in question will be downloaded.'),
                  hideCheckBox: true,
                  buttonMsg: this.translate.instant('Download Key'),
                  cancelMsg: this.translate.instant('Close'),
                }).pipe(
                  filter(Boolean),
                  untilDestroyed(this, 'destroy'),
                ).subscribe(() => {
                  this.loader.open();
                  this.ws.call('core.download', ['pool.dataset.export_key', [rowData.id, true], fileName]).pipe(untilDestroyed(this, 'destroy')).subscribe((res) => {
                    this.loader.close();
                    const url = res[1];
                    this.storageService.streamDownloadFile(this.http, url, fileName, mimetype)
                      .pipe(untilDestroyed(this, 'destroy'))
                      .subscribe((file) => {
                        if (res !== null) {
                          this.storageService.downloadBlob(file, fileName);
                        }
                      });
                  }, (error) => {
                    this.loader.close();
                    new EntityUtils().handleWsError(this, error, this.dialogService);
                  });
                });
              });
            },
          });
        }
      }
    }
    return encryptionActions as EntityTableAction[];
  }

  dataHandler(tempData: any): TreeNode {
    const data: VolumesListDataset = tempData;
    const node: TreeNode = {};
    node.data = data;
    this.getMoreDatasetInfo(data, data.parent);
    node.data.group_actions = true;
    let actionsTitle: string = this.translate.instant(helptext.dataset_actions);
    if (data.type === DatasetType.Volume) {
      actionsTitle = this.translate.instant(helptext.zvol_actions);
    }
    const actions = [{ title: actionsTitle, actions: this.getActions(data) }];
    if (data.type === DatasetType.Filesystem || data.type === DatasetType.Volume) {
      const encryptionActions = this.getEncryptedDatasetActions(data);
      if (encryptionActions.length > 0) {
        actions.push({ title: this.translate.instant(helptext.encryption_actions_title), actions: encryptionActions });
      }
    }
    node.data.actions = actions;

    node.children = [];

    if (data.children) {
      node.children = data.children.map((child) => {
        child.parent = data;
        return this.dataHandler(child);
      });
      node.children.sort((a, b) => a.data.id.localeCompare(b.data.id));
    }
    delete node.data.children;

    return node;
  }

  getMoreDatasetInfo(dataObj: VolumesListDataset, parent: VolumesListDataset | VolumesListPool): void {
    const inherits = this.translate.instant(T('Inherits'));
    this.datasets.forEach((dataset) => {
      if (dataset.id === dataObj.id) {
        if (dataset.compression) {
          if (dataset.compression.source !== ZfsPropertySource.Inherited) {
            dataObj.compression = (dataset.compression.parsed);
          } else {
            dataObj.compression = (inherits + ' (' + dataset.compression.parsed + ')');
          }
        }
        if (dataset.compressratio) {
          if (dataset.compressratio.source !== ZfsPropertySource.Inherited) {
            dataObj.compressratio = (dataset.compressratio.parsed);
          } else {
            dataObj.compressratio = (inherits + ' (' + dataset.compressratio.parsed + ')');
          }
        }
        if (dataset.readonly) {
          if (dataset.readonly.source !== ZfsPropertySource.Inherited) {
            dataObj.readonly = (dataset.readonly.parsed) as any;
          } else {
            dataObj.readonly = (inherits + ' (' + dataset.readonly.parsed + ')');
          }
        }
        if (dataset.deduplication) {
          if (dataset.deduplication.source !== ZfsPropertySource.Inherited) {
            dataObj.dedup = (dataset.deduplication.parsed);
          } else {
            dataObj.dedup = (inherits + ' (' + dataset.deduplication.parsed + ')');
          }
        }
        if (dataset.comments) {
          if (dataset.comments.source !== ZfsPropertySource.Inherited) {
            dataObj.comments = dataset.comments.parsed;
          } else {
            dataObj.comments = ('');
          }
        }
      }
      // add name, available and used into the data object
      dataObj.name = dataObj.name.split('/').pop();
      dataObj.available_parsed = this.storageService.convertBytestoHumanReadable(dataObj.available.parsed || 0);
      dataObj.used_parsed = this.storageService.convertBytestoHumanReadable(dataObj.used.parsed || 0);
      dataObj.is_encrypted_root = (dataObj.id === dataObj.encryption_root);
      if (dataObj.is_encrypted_root) {
        this.parentVolumesListComponent.hasEncryptedRoot[(parent as VolumesListDataset).pool] = true;
      }
      dataObj.non_encrypted_on_encrypted = (!dataObj.encrypted && (parent as VolumesListDataset).encrypted);
    });
  }
}
