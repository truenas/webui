import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import helptext from 'app/helptext/storage/vmware-snapshot/vm-ware-snapshot';
import {
  MatchDatastoresWithDatasets, VmwareDatastore, VmwareFilesystem, VmwareSnapshot, VmwareSnapshotUpdate,
} from 'app/interfaces/vmware.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService2 } from 'app/services/ws2.service';

@UntilDestroy()
@Component({
  templateUrl: './vmware-snapshot-form.component.html',
  styleUrls: ['./vmware-snapshot-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VmwareSnapshotFormComponent implements OnInit {
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
    private ws2: WebSocketService2,
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

    if (!hostname || !username || !password) {
      return;
    }

    this.isLoading = true;
    this.ws2.call('vmware.match_datastores_with_datasets', [{
      hostname,
      username,
      password,
    }]).pipe(untilDestroyed(this)).subscribe({
      next: (res: MatchDatastoresWithDatasets) => {
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
      error: (error: WebsocketError) => {
        this.isLoading = false;
        this.datastoreOptions$ = of([]);
        if (error.reason && error.reason.includes('[ETIMEDOUT]')) {
          this.dialogService.errorReport(helptext.connect_err_dialog.title, helptext.connect_err_dialog.msg);
        } else {
          new EntityUtils().handleWsError(this, error, this.dialogService);
        }
        this.cdr.markForCheck();
      },
    });
  }

  onSubmit(): void {
    const values = this.form.value as VmwareSnapshotUpdate;

    this.isLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws2.call('vmware.create', [values]);
    } else {
      request$ = this.ws2.call('vmware.update', [
        this.editingSnapshot.id,
        values,
      ]);
    }

    const datastoreObj = this.datastoreList.find((datastore) => datastore.name === values.datastore);
    const fileSystemObj = this.filesystemList.find((filesystem) => filesystem.name === values.filesystem);

    (
      datastoreObj.filesystems[0] !== values.filesystem
        ? this.dialogService.confirm({
          title: this.translate.instant('Are you sure?'),
          message: this.translate.instant(
            'The filesystem {filesystemName} is {filesystemDescription}, but datastore {datastoreName} is {datastoreDescription}. Is this correct?',
            {
              filesystemName: fileSystemObj.name,
              filesystemDescription: fileSystemObj.description || this.translate.instant('(No description)'),
              datastoreName: datastoreObj.name,
              datastoreDescription: datastoreObj.description || this.translate.instant('(No description)'),
            },
          ),
          hideCheckBox: true,
        })
        : of(true)
    ).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      request$.pipe(untilDestroyed(this)).subscribe({
        next: () => {
          this.isLoading = false;
          this.slideInService.close();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
    });
  }
}
