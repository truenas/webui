import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnAutocompleteComponent, TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import {
  BehaviorSubject, Observable, debounceTime, filter, map, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DatasetPreset } from 'app/enums/dataset.enum';
import { NfsSecurityProvider } from 'app/enums/nfs-security-provider.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextSharingNfs } from 'app/helptext/sharing';
import { DatasetCreate } from 'app/interfaces/dataset.interface';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { ExplorerCreateDatasetComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxIpInputWithNetmaskComponent } from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { defaultDebounceTimeMs } from 'app/modules/forms/ix-forms/ix-forms.constants';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { ipv4or6cidrValidator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { UserGroupExistenceValidationService } from 'app/modules/forms/ix-forms/validators/user-group-existence-validation.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { translateOptions } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { getRootDatasetsValidator } from 'app/pages/sharing/utils/root-datasets-validator';
import { DatasetService } from 'app/services/dataset/dataset.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { UserService } from 'app/services/user.service';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

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
    ModalHeaderComponent,
    ReactiveFormsModule,
    IxExplorerComponent,
    ExplorerCreateDatasetComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnSelectComponent,
    TnAutocompleteComponent,
    IxListComponent,
    IxListItemComponent,
    IxIpInputWithNetmaskComponent,
    IxInputComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class NfsFormComponent extends SidePanelForm implements OnInit {
  private api = inject(ApiService);
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private filesystemService = inject(FilesystemService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private datasetService = inject(DatasetService);
  private userService = inject(UserService);
  private existenceValidation = inject(UserGroupExistenceValidationService);
  private store$ = inject<Store<ServicesState>>(Store);

  /** Form data when hosted in a `<tn-side-panel>` (the legacy SlideIn host provides it via `slideInRef`). */
  readonly data = input<NfsFormData>();

  private validatorsService = inject(IxValidatorsService);
  private destroyRef = inject(DestroyRef);

  existingNfsShare: NfsShare | undefined;
  defaultNfsShare: NfsShare | undefined;

  readonly isLoading = signal(false);
  protected readonly isAdvancedMode = signal(false);
  createDatasetProps: Omit<DatasetCreate, 'name'> = {
    share_type: DatasetPreset.Multiprotocol,
  };

  protected readonly form = this.formBuilder.group({
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

  readonly canSubmit = this.trackCanSubmit(this.isLoading);

  /** Resolves form data from whichever host opened the form. */
  private get incomingData(): NfsFormData | undefined {
    return (this.slideInRef?.getData() as NfsFormData | undefined) ?? this.data();
  }

  get isNew(): boolean {
    return !this.existingNfsShare;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add NFS Share')
      : this.translate.instant('Edit NFS Share');
  }

  protected readonly requiredRoles = [Role.SharingNfsWrite, Role.SharingWrite];
  readonly helptext = helptextSharingNfs;
  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });
  readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));

  readonly securityOptions = translateOptions(this.translate, [
    { label: 'SYS', value: NfsSecurityProvider.Sys },
    { label: 'KRB5', value: NfsSecurityProvider.Krb5 },
    { label: 'KRB5I', value: NfsSecurityProvider.Krb5i },
    { label: 'KRB5P', value: NfsSecurityProvider.Krb5p },
  ]);

  // Server-searched option streams for the user/group autocompletes. Both user fields
  // (maproot/mapall) share one stream — options only matter while that dropdown is open.
  protected readonly userSearch$ = new BehaviorSubject('');
  protected readonly userOptions$ = this.userSearch$.pipe(
    debounceTime(defaultDebounceTimeMs),
    switchMap((query) => this.userService.userQueryDsCache(query)),
    map((users) => users.map((user) => ({ label: user.username, value: user.username }))),
  );

  protected readonly groupSearch$ = new BehaviorSubject('');
  protected readonly groupOptions$ = this.groupSearch$.pipe(
    debounceTime(defaultDebounceTimeMs),
    switchMap((query) => this.userService.groupQueryDsCache(query)),
    map((groups) => groups.map((group) => ({ label: group.group, value: group.group }))),
  );

  private setNfsShareForEdit(share: NfsShare): void {
    share.networks.forEach(() => this.addNetworkControl());
    share.hosts.forEach(() => this.addHostControl());
    this.form.patchValue(share);
  }

  ngOnInit(): void {
    this.existingNfsShare = this.incomingData?.existingNfsShare;
    this.defaultNfsShare = this.incomingData?.defaultNfsShare;

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
    this.isAdvancedMode.update((isAdvanced) => !isAdvanced);
  }

  protected onSubmit(): void {
    const nfsShare = { ...this.form.value };

    if (!this.isEnterprise()) {
      delete nfsShare.expose_snapshots;
    }

    let request$: Observable<unknown>;
    if (this.existingNfsShare) {
      request$ = this.api.call('sharing.nfs.update', [this.existingNfsShare.id, nfsShare]);
    } else {
      request$ = this.api.call('sharing.nfs.create', [nfsShare]);
    }

    this.datasetService.rootLevelDatasetWarning(
      nfsShare.path,
      this.translate.instant(helptextSharingNfs.rootLevelWarning),
      !this.form.controls.path.dirty,
    )
      .pipe(
        filter(Boolean),
        tap(() => {
          this.isLoading.set(true);
        }),
        switchMap(() => request$),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: () => {
          if (this.isNew) {
            this.snackbar.success(this.translate.instant('NFS share created'));
          } else {
            this.snackbar.success(this.translate.instant('NFS share updated'));
          }
          this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.Nfs }));
          this.isLoading.set(false);
          this.close(true);
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
  }
}
