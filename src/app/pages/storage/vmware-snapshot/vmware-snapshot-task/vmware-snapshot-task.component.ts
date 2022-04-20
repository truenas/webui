import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import helptext from 'app/helptext/storage/vmware-snapshot/vmware-snapshot';
import {
  MatchDatastoresWithDatasets,
  MatchDatastoresWithDatasetsParams, VmwareDatastore, VmwareFilesystem, VmwareSnapshot, VmwareSnapshotUpdate,
} from 'app/interfaces/vmware.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './vmware-snapshot-task.component.html',
  styleUrls: ['./vmware-snapshot-task.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VmwareSnapshotTaskComponent implements OnInit {
  get isNew(): boolean {
    return !this.editingSnapshot;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add VM Snapshot')
      : this.translate.instant('Edit VM Snapshot');
  }

  form = this.fb.group({
    hostname: ['', Validators.required],
    username: ['', Validators.required],
    password: ['', Validators.required],
    filesystem: ['', Validators.required],
    datastore: ['', Validators.required],
  });

  isLoading = false;

  readonly labels = {
    hostname: helptext.VMware_snapshot_form_hostname_placeholder,
    username: helptext.VMware_snapshot_form_username_placeholder,
    password: helptext.VMware_snapshot_form_password_placeholder,
    filesystem: helptext.VMware_snapshot_form_filesystem_placeholder,
    datastore: helptext.VMware_snapshot_form_datastore_placeholder,
  };

  readonly tooltips = {
    hostname: helptext.VMware_snapshot_form_hostname_tooltip,
    username: helptext.VMware_snapshot_form_username_tooltip,
    password: helptext.VMware_snapshot_form_password_tooltip,
    filesystem: helptext.VMware_snapshot_form_filesystem_tooltip,
    datastore: helptext.VMware_snapshot_form_datastore_tooltip,
  };

  private editingSnapshot: VmwareSnapshot;
  private datastoreList: VmwareDatastore[];
  private filesystemList: VmwareFilesystem[];

  filesystemOptions$ = of([]);
  datastoreOptions$ = of([]);

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    protected dialogService: DialogService,
  ) {}

  ngOnInit(): void {
    this.form.controls.datastore.valueChanges.pipe(untilDestroyed(this)).subscribe((value: string) => {
      const fileSystemValue = this.datastoreList?.find((datastore) => datastore.name === value)?.filesystems[0];
      if (fileSystemValue) {
        this.form.controls.filesystem.setValue(fileSystemValue);
      }
    });
  }

  get disableFetchDatastores(): boolean {
    const { hostname, username, password } = this.form.value;
    return !hostname || !username || !password;
  }

  setSnapshotForEdit(snapshot: VmwareSnapshot): void {
    this.editingSnapshot = snapshot;
    this.form.patchValue(snapshot);
    this.onFetchDataStores();
  }

  onFetchDataStores(): void {
    const { hostname, username, password } = this.form.value;

    if (hostname && username && password) {
      this.isLoading = true;
      this.ws.call('vmware.match_datastores_with_datasets', [{
        hostname,
        username,
        password,
      } as MatchDatastoresWithDatasetsParams]).pipe(untilDestroyed(this)).subscribe(
        (res: MatchDatastoresWithDatasets) => {
          this.isLoading = false;
          this.filesystemList = res.filesystems;
          this.datastoreList = res.datastores;

          this.filesystemOptions$ = of(
            this.filesystemList.map((filesystem) => ({
              label: filesystem.name,
              value: filesystem.name,
            })),
          );

          this.datastoreOptions$ = of(
            this.datastoreList.map((datastore) => ({
              label: datastore.name,
              value: datastore.name,
            })),
          );
          this.cdr.markForCheck();
        },
        (error) => {
          this.isLoading = false;
          this.datastoreOptions$ = of([]);
          if (error.reason && error.reason.includes('[ETIMEDOUT]')) {
            this.dialogService.errorReport(helptext.connect_err_dialog.title, helptext.connect_err_dialog.msg);
          } else {
            new EntityUtils().handleWsError(null, error, this.dialogService);
          }
          this.cdr.markForCheck();
        },
      );
    }
  }

  onSubmit(): void {
    const values = this.form.value;

    this.isLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('vmware.create', [values]);
    } else {
      request$ = this.ws.call('vmware.update', [
        this.editingSnapshot.id,
        values as VmwareSnapshotUpdate,
      ]);
    }

    // Looks for a mismatch and raises a confirm dialog if there is one; otherwise saves w/o the dialog
    const dataStoreMatch = this.datastoreList.find((datastore) => datastore.name === values.datastore);
    if (
      !dataStoreMatch
      || (dataStoreMatch.name === values.datastore && dataStoreMatch.filesystems[0] !== values.filesystem)
    ) {
      const fileSystemObj = this.filesystemList.find((item) => item.name === values.filesystem);
      const datastoreObj = this.datastoreList.find((item) => item.name === values.datastore);

      this.dialogService.confirm({
        title: this.translate.instant('Are you sure?'),
        message: this.translate.instant(
          'The filesystem {filesystemName} is {filesystemDescription}, but datastore {datastoreName} is {datastoreDescription}. Is this correct?',
          {
            filesystemName: fileSystemObj.name,
            filesystemDescription: fileSystemObj.description,
            datastoreName: datastoreObj.name,
            datastoreDescription: datastoreObj.description || this.translate.instant('(No description)'),
          },
        ),
        hideCheckBox: true,
      }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        request$.pipe(untilDestroyed(this)).subscribe(() => {
          this.isLoading = false;
          this.slideInService.close();
        }, (error) => {
          this.isLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        });
      });
    } else {
      request$.pipe(untilDestroyed(this)).subscribe(() => {
        this.isLoading = false;
        this.slideInService.close();
      }, (error) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      });
    }
  }
}
