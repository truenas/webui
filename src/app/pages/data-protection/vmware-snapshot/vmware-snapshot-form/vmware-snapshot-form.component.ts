import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, DestroyRef, input, output, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnButtonComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { Observable, of } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { extractApiErrorDetails } from 'app/helpers/api.helper';
import { helptextVmwareSnapshot } from 'app/helptext/storage/vmware-snapshot/vmware-snapshot';
import { Option } from 'app/interfaces/option.interface';
import {
  MatchDatastoresWithDatasets, VmwareDatastore, VmwareFilesystem, VmwareSnapshot,
} from 'app/interfaces/vmware.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-vmware-snapshot-form',
  templateUrl: './vmware-snapshot-form.component.html',
  styleUrls: ['./vmware-snapshot-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
    TnButtonComponent,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class VmwareSnapshotFormComponent implements OnInit {
  private errorHandler = inject(ErrorHandlerService);
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  protected dialogService = inject(DialogService);
  private destroyRef = inject(DestroyRef);
  // Optional: present only in the legacy SlideIn host. Absent when hosted in the
  // `<tn-side-panel>` form panel, where data arrives via {@link snapshotToEdit}.
  private slideInRef = inject<SlideInRef<VmwareSnapshot | undefined, boolean>>(SlideInRef, { optional: true });

  /** The record being edited, supplied by the `<tn-side-panel>` host (undefined = create). */
  readonly snapshotToEdit = input<VmwareSnapshot | undefined>(undefined);

  /** Fired on a successful submit when hosted in a `<tn-side-panel>` (forwarded from `<ix-form>`). */
  readonly closed = output<boolean>();

  /** The inner `<ix-form>`, used to expose the host-facing dual-host surface. */
  private readonly ixForm = viewChild(IxFormComponent);

  readonly requiredRoles = [Role.SnapshotTaskWrite];
  protected readonly InputType = InputType;

  get isNew(): boolean {
    return !this.editingSnapshot;
  }

  form = this.fb.nonNullable.group({
    hostname: ['', Validators.required],
    username: ['', Validators.required],
    password: ['', Validators.required],
    filesystem: ['', Validators.required],
    datastore: ['', Validators.required],
  });

  isLoading = false;
  protected editingSnapshot: VmwareSnapshot | undefined;

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

  /** Host entry point (`<tn-side-panel>` footer Save) to trigger submission. */
  submit(): void {
    this.ixForm()?.submit();
  }

  /** Whether the form may be submitted right now; the `<tn-side-panel>` host reads this for its Save action. */
  canSubmit(): boolean {
    return this.ixForm()?.canSubmit() ?? false;
  }

  /** Whether the form is currently submitting; the host shows a progress bar while true. */
  isBusy(): boolean {
    return this.ixForm()?.isLoading() ?? false;
  }

  /** Host hook (`<tn-side-panel>` closeGuard) to confirm before discarding unsaved edits. */
  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  ngOnInit(): void {
    this.editingSnapshot = this.slideInRef?.getData() ?? this.snapshotToEdit();

    this.form.controls.datastore.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value: string) => {
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
    }]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

  protected handleSubmit = (event: FormSubmitEvent<VmwareSnapshot>): SubmitResult => {
    const values = event.allValues;

    const datastoreObj = this.datastoreList.find((datastore) => datastore.name === values.datastore);
    const fileSystemObj = this.filesystemList.find((filesystem) => filesystem.name === values.filesystem);

    if (!datastoreObj || !fileSystemObj) {
      throw new Error('Datastore or filesystem not found');
    }

    // Confirm only when the chosen filesystem isn't the datastore's primary one.
    const confirm$ = datastoreObj.filesystems[0] !== values.filesystem
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
      : of(true);

    const request$: Observable<unknown> = confirm$.pipe(
      filter(Boolean),
      switchMap(() => (this.editingSnapshot
        ? this.api.call('vmware.update', [this.editingSnapshot.id, values])
        : this.api.call('vmware.create', [values]))),
    );

    return {
      request$,
      successMessage: this.translate.instant('VM Snapshot saved'),
    };
  };
}
