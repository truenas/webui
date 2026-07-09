import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, inject, input, signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnAutocompleteComponent, TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import {
  BehaviorSubject, Observable, catchError, debounceTime, distinctUntilChanged, filter, map, of, shareReplay,
  switchMap, tap,
} from 'rxjs';
import { DatasetPreset } from 'app/enums/dataset.enum';
import { NfsProtocol } from 'app/enums/nfs-protocol.enum';
import { NfsSecurityProvider } from 'app/enums/nfs-security-provider.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextSharingNfs } from 'app/helptext/sharing';
import { DatasetCreate } from 'app/interfaces/dataset.interface';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { ExplorerCreateDatasetComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxIpInputWithNetmaskComponent } from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { defaultDebounceTimeMs } from 'app/modules/forms/ix-forms/ix-forms.constants';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { ipv4or6cidrValidator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { UserGroupExistenceValidationService } from 'app/modules/forms/ix-forms/validators/user-group-existence-validation.service';
import { translateOptions } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { getRootDatasetsValidator } from 'app/pages/sharing/utils/root-datasets-validator';
import { DatasetService } from 'app/services/dataset/dataset.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { UserService } from 'app/services/user.service';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

/** Edit/default data supplied by the panel host (via `nfsShareData` input). */
export interface NfsFormData {
  existingNfsShare?: NfsShare;
  defaultNfsShare?: NfsShare;
}

@Component({
  selector: 'ix-nfs-form',
  templateUrl: './nfs-form.component.html',
  styleUrls: ['./nfs-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnSelectComponent,
    TnAutocompleteComponent,
    TnButtonComponent,
    IxExplorerComponent,
    ExplorerCreateDatasetComponent,
    IxListComponent,
    IxListItemComponent,
    IxIpInputWithNetmaskComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class NfsFormComponent extends IxFormHostForm implements OnInit {
  private api = inject(ApiService);
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private filesystemService = inject(FilesystemService);
  private datasetService = inject(DatasetService);
  private userService = inject(UserService);
  private existenceValidation = inject(UserGroupExistenceValidationService);
  private errorHandler = inject(ErrorHandlerService);
  private store$ = inject<Store<ServicesState>>(Store);

  private validatorsService = inject(IxValidatorsService);

  /** Edit/default data supplied by the `<tn-side-panel>` host. */
  readonly nfsShareData = input<NfsFormData | undefined>(undefined);

  existingNfsShare: NfsShare | undefined;
  defaultNfsShare: NfsShare | undefined;

  protected isAdvancedMode = signal(false);
  createDatasetProps: Omit<DatasetCreate, 'name'> = {
    share_type: DatasetPreset.Multiprotocol,
  };

  form = this.formBuilder.group({
    path: ['', Validators.required],
    comment: [''],
    enabled: [true],
    expose_snapshots: [false],
    ro: [false],
    maproot_user: [''],
    maproot_group: [''],
    mapall_user: [''],
    mapall_group: [''],
    security: [[] as NfsSecurityProvider[]],
    networks: this.formBuilder.array<string>([]),
    hosts: this.formBuilder.array<string>([]),
  });

  get isNew(): boolean {
    return !this.existingNfsShare;
  }

  readonly requiredRoles = [Role.SharingNfsWrite, Role.SharingWrite];
  readonly helptext = helptextSharingNfs;
  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });
  readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));

  /** The Security select only applies when the NFS service has protocol v4 enabled. */
  protected readonly hasNfsSecurityField = toSignal(
    this.api.call('nfs.config').pipe(
      map((config) => !!config.protocols?.includes(NfsProtocol.V4)),
      catchError((error: unknown) => {
        this.errorHandler.handleError(error);
        return of(false);
      }),
    ),
    { initialValue: false },
  );

  readonly securityOptions = translateOptions(this.translate, [
    { label: 'SYS', value: NfsSecurityProvider.Sys },
    { label: 'KRB5', value: NfsSecurityProvider.Krb5 },
    { label: 'KRB5I', value: NfsSecurityProvider.Krb5i },
    { label: 'KRB5P', value: NfsSecurityProvider.Krb5p },
  ]);

  // Server-searched option streams for the user/group autocompletes. Both user fields
  // (maproot/mapall) share one stream — options only matter while that dropdown is open —
  // and shareReplay collapses their two `async` subscribers into a single query per search
  // (directory-service queries can be slow; never duplicate them). switchMap cancels
  // in-flight queries on new input; catchError keeps one failed DS query from killing the
  // stream for the rest of the form's life.
  protected readonly usersLoading = signal(false);
  protected readonly userSearch$ = new BehaviorSubject('');
  protected readonly userOptions$ = this.userSearch$.pipe(
    debounceTime(defaultDebounceTimeMs),
    distinctUntilChanged(),
    tap(() => this.usersLoading.set(true)),
    switchMap((query) => this.userService.userQueryDsCache(query).pipe(
      catchError((error: unknown) => {
        this.errorHandler.handleError(error);
        return of([]);
      }),
    )),
    map((users) => users.map((user) => ({ label: user.username, value: user.username }))),
    tap(() => this.usersLoading.set(false)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  protected readonly groupsLoading = signal(false);
  protected readonly groupSearch$ = new BehaviorSubject('');
  protected readonly groupOptions$ = this.groupSearch$.pipe(
    debounceTime(defaultDebounceTimeMs),
    distinctUntilChanged(),
    tap(() => this.groupsLoading.set(true)),
    switchMap((query) => this.userService.groupQueryDsCache(query).pipe(
      catchError((error: unknown) => {
        this.errorHandler.handleError(error);
        return of([]);
      }),
    )),
    map((groups) => groups.map((group) => ({ label: group.group, value: group.group }))),
    tap(() => this.groupsLoading.set(false)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private setNfsShareForEdit(share: NfsShare): void {
    share.networks.forEach(() => this.addNetworkControl());
    share.hosts.forEach(() => this.addHostControl());
    this.form.patchValue(share);
  }

  ngOnInit(): void {
    // Edit/default data arrives via the `nfsShareData` input from the side-panel host.
    const data = this.nfsShareData();
    this.existingNfsShare = data?.existingNfsShare;
    this.defaultNfsShare = data?.defaultNfsShare;

    this.form.controls.path.addValidators(this.validatorsService.customValidator(
      getRootDatasetsValidator(this.existingNfsShare ? [this.existingNfsShare.path] : []),
      this.translate.instant('Sharing root datasets is not recommended. Please create a child dataset.'),
    ));

    // Parity with the former ix-user/group-combobox controls: custom-typed values
    // must exist on the system (empty values pass).
    this.form.controls.maproot_user.addAsyncValidators(this.existenceValidation.validateUserExists());
    this.form.controls.mapall_user.addAsyncValidators(this.existenceValidation.validateUserExists());
    this.form.controls.maproot_group.addAsyncValidators(this.existenceValidation.validateGroupExists());
    this.form.controls.mapall_group.addAsyncValidators(this.existenceValidation.validateGroupExists());

    if (this.defaultNfsShare) {
      this.form.patchValue(this.defaultNfsShare);
    }

    if (this.existingNfsShare) {
      this.setNfsShareForEdit(this.existingNfsShare);
    }
  }

  protected addNetworkControl(): void {
    this.form.controls.networks.push(this.formBuilder.control('', [Validators.required, ipv4or6cidrValidator()]));
  }

  protected removeNetworkControl(index: number): void {
    this.form.controls.networks.removeAt(index);
  }

  protected addHostControl(): void {
    this.form.controls.hosts.push(this.formBuilder.control('', Validators.required));
  }

  protected removeHostControl(index: number): void {
    this.form.controls.hosts.removeAt(index);
  }

  protected toggleAdvancedMode(): void {
    this.isAdvancedMode.update((value) => !value);
  }

  protected handleSubmit = (_: FormSubmitEvent): SubmitResult => {
    const nfsShare = { ...this.form.value };

    if (!this.isEnterprise()) {
      delete nfsShare.expose_snapshots;
    }

    const apiCall$: Observable<unknown> = this.existingNfsShare
      ? this.api.call('sharing.nfs.update', [this.existingNfsShare.id, nfsShare])
      : this.api.call('sharing.nfs.create', [nfsShare]);

    // The root-level dataset warning prompts confirmation before the create/update fires;
    // a cancel completes the chain without emitting, so the wrapper just resets its loading state.
    const request$ = this.datasetService.rootLevelDatasetWarning(
      nfsShare.path,
      this.translate.instant(helptextSharingNfs.rootLevelWarning),
      !this.form.controls.path.dirty,
    ).pipe(
      filter(Boolean),
      switchMap(() => apiCall$),
    );

    return {
      request$,
      successMessage: this.isNew
        ? this.translate.instant('NFS share created')
        : this.translate.instant('NFS share updated'),
      onSuccess: () => {
        this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.Nfs }));
      },
    };
  };
}
