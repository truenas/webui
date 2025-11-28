import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { extractApiErrorDetails } from 'app/helpers/api.helper';
import { helptextVmwareSnapshot } from 'app/helptext/storage/vmware-snapshot/vmware-snapshot';
import { Option } from 'app/interfaces/option.interface';
import {
  MatchDatastoresWithDatasets, VmwareDatastore, VmwareFilesystem, VmwareSnapshot, VmwareSnapshotUpdate,
} from 'app/interfaces/vmware.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-vmware-snapshot-form',
  templateUrl: './vmware-snapshot-form.component.html',
  styleUrls: ['./vmware-snapshot-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    IxSelectComponent,
    TranslateModule,
  ],
})
export class VmwareSnapshotFormComponent implements OnInit {
  private errorHandler = inject(ErrorHandlerService);
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private cdr = inject(ChangeDetectorRef);
  protected dialogService = inject(DialogService);
  slideInRef = inject<SlideInRef<VmwareSnapshot | undefined, boolean>>(SlideInRef);

  protected readonly requiredRoles = [Role.SnapshotTaskWrite];

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
  protected editingSnapshot: VmwareSnapshot;

  readonly labels = {
    hostname: helptextVmwareSnapshot.hostnameLabel,
    username: helptextVmwareSnapshot.usernameLabel,
    password: helptextVmwareSnapshot.passwordLabel,
    filesystem: helptextVmwareSnapshot.filesystemLabel,
    datastore: helptextVmwareSnapshot.datastoreLabel,
  };

  readonly tooltips = {
    hostname: helptextVmwareSnapshot.hostnameTooltip,
    username: helptextVmwareSnapshot.usernameTooltip,
    password: helptextVmwareSnapshot.passwordTooltip,
    filesystem: helptextVmwareSnapshot.filesystemTooltip,
    datastore: helptextVmwareSnapshot.datastoreTooltip,
  };

  private datastoreList: VmwareDatastore[];
  private filesystemList: VmwareFilesystem[];

  filesystemOptions$ = of<Option[]>([]);
  datastoreOptions$ = of<Option[]>([]);

  constructor() {
    const slideInRef = this.slideInRef;

    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    const snapshot = slideInRef.getData();
    if (snapshot) {
      this.editingSnapshot = snapshot;
    }
  }

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

  private setSnapshotForEdit(): void {
    this.form.patchValue(this.editingSnapshot);
    this.onFetchDataStores();
  }

  onFetchDataStores(): void {
    const { hostname, username, password } = this.form.value;

    if (!hostname || !username || !password) {
      return;
    }

    this.isLoading = true;
    this.api.call('vmware.match_datastores_with_datasets', [{
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
      error: (error: unknown) => {
        this.isLoading = false;
        this.datastoreOptions$ = of<Option[]>([]);
        const apiError = extractApiErrorDetails(error);
        if (apiError?.reason?.includes('[ETIMEDOUT]')) {
          this.dialogService.error({
            title: helptextVmwareSnapshot.connectionErrorDialog.title,
            message: helptextVmwareSnapshot.connectionErrorDialog.message,
          });
        } else {
          this.errorHandler.showErrorModal(error);
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
      request$ = this.api.call('vmware.create', [values]);
    } else {
      request$ = this.api.call('vmware.update', [
        this.editingSnapshot.id,
        values,
      ]);
    }

    const datastoreObj = this.datastoreList.find((datastore) => datastore.name === values.datastore);
    const fileSystemObj = this.filesystemList.find((filesystem) => filesystem.name === values.filesystem);

    if (!datastoreObj || !fileSystemObj) {
      throw new Error('Datastore or filesystem not found');
    }

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
          this.slideInRef.close({ response: true });
        },
        error: (error: unknown) => {
          this.isLoading = false;
          this.formErrorHandler.handleValidationErrors(error, this.form);
          this.cdr.markForCheck();
        },
      });
    });
  }
}
