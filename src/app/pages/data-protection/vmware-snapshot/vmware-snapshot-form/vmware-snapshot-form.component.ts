import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { helptextVmwareSnapshot } from 'app/helptext/storage/vmware-snapshot/vmware-snapshot';
import {
  MatchDatastoresWithDatasets, VmwareDatastore, VmwareFilesystem, VmwareSnapshot, VmwareSnapshotUpdate,
} from 'app/interfaces/vmware.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './vmware-snapshot-form.component.html',
  styleUrls: ['./vmware-snapshot-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VmwareSnapshotFormComponent implements OnInit {
  readonly requiredRoles = [Role.FullAdmin];

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
    hostname: helptextVmwareSnapshot.VMware_snapshot_form_hostname_placeholder,
    username: helptextVmwareSnapshot.VMware_snapshot_form_username_placeholder,
    password: helptextVmwareSnapshot.VMware_snapshot_form_password_placeholder,
    filesystem: helptextVmwareSnapshot.VMware_snapshot_form_filesystem_placeholder,
    datastore: helptextVmwareSnapshot.VMware_snapshot_form_datastore_placeholder,
  };

  readonly tooltips = {
    hostname: helptextVmwareSnapshot.VMware_snapshot_form_hostname_tooltip,
    username: helptextVmwareSnapshot.VMware_snapshot_form_username_tooltip,
    password: helptextVmwareSnapshot.VMware_snapshot_form_password_tooltip,
    filesystem: helptextVmwareSnapshot.VMware_snapshot_form_filesystem_tooltip,
    datastore: helptextVmwareSnapshot.VMware_snapshot_form_datastore_tooltip,
  };

  private datastoreList: VmwareDatastore[];
  private filesystemList: VmwareFilesystem[];

  filesystemOptions$ = of([]);
  datastoreOptions$ = of([]);

  constructor(
    private errorHandler: ErrorHandlerService,
    private fb: FormBuilder,
    private ws: WebSocketService,
    private translate: TranslateService,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    protected dialogService: DialogService,
    private slideInRef: IxSlideInRef<VmwareSnapshotFormComponent>,
    @Inject(SLIDE_IN_DATA) private editingSnapshot: VmwareSnapshot,
  ) {}

  ngOnInit(): void {
    this.form.controls.datastore.valueChanges.pipe(untilDestroyed(this)).subscribe((value: string) => {
      const fileSystemValue = this.datastoreList?.find((datastore) => datastore.name === value)?.filesystems[0];
      if (fileSystemValue) {
        this.form.controls.filesystem.setValue(fileSystemValue);
      }
    });

    if (this.editingSnapshot) {
      this.setSnapshotForEdit();
    }
  }

  get disableFetchDatastores(): boolean {
    const { hostname, username, password } = this.form.value;
    return !hostname || !username || !password;
  }

  setSnapshotForEdit(): void {
    this.form.patchValue(this.editingSnapshot);
    this.onFetchDataStores();
  }

  onFetchDataStores(): void {
    const { hostname, username, password } = this.form.value;

    if (!hostname || !username || !password) {
      return;
    }

    this.isLoading = true;
    this.ws.call('vmware.match_datastores_with_datasets', [{
      hostname,
      username,
      password,
    }]).pipe(untilDestroyed(this)).subscribe({
      next: (matches: MatchDatastoresWithDatasets) => {
        this.isLoading = false;
        this.filesystemList = matches.filesystems;
        this.datastoreList = matches.datastores;

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
      error: (error: WebSocketError) => {
        this.isLoading = false;
        this.datastoreOptions$ = of([]);
        if (error.reason && error.reason.includes('[ETIMEDOUT]')) {
          this.dialogService.error({
            title: helptextVmwareSnapshot.connect_err_dialog.title,
            message: helptextVmwareSnapshot.connect_err_dialog.msg,
          });
        } else {
          this.dialogService.error(this.errorHandler.parseError(error));
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
      request$ = this.ws.call('vmware.create', [values]);
    } else {
      request$ = this.ws.call('vmware.update', [
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
          hideCheckbox: true,
        })
        : of(true)
    ).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      request$.pipe(untilDestroyed(this)).subscribe({
        next: () => {
          this.isLoading = false;
          this.slideInRef.close(true);
        },
        error: (error: unknown) => {
          this.isLoading = false;
          this.formErrorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
    });
  }
}
