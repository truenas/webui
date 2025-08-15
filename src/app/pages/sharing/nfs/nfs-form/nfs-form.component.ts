import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  Observable, filter, of, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DatasetPreset } from 'app/enums/dataset.enum';
import { NfsProtocol } from 'app/enums/nfs-protocol.enum';
import { NfsSecurityProvider } from 'app/enums/nfs-security-provider.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextSharingNfs } from 'app/helptext/sharing';
import { DatasetCreate } from 'app/interfaces/dataset.interface';
import { NfsShare, NfsShareUpdate } from 'app/interfaces/nfs-share.interface';
import { Option } from 'app/interfaces/option.interface';
import { GroupComboboxProvider } from 'app/modules/forms/ix-forms/classes/group-combobox-provider';
import { UserComboboxProvider } from 'app/modules/forms/ix-forms/classes/user-combobox-provider';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { ExplorerCreateDatasetComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxIpInputWithNetmaskComponent } from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { ipv4or6cidrValidator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { getRootDatasetsValidator } from 'app/pages/sharing/utils/root-datasets-validator';
import { DatasetService } from 'app/services/dataset/dataset.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { UserService } from 'app/services/user.service';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-nfs-form',
  templateUrl: './nfs-form.component.html',
  styleUrls: ['./nfs-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxExplorerComponent,
    ExplorerCreateDatasetComponent,
    IxInputComponent,
    IxCheckboxComponent,
    IxComboboxComponent,
    IxSelectComponent,
    IxListComponent,
    IxListItemComponent,
    IxIpInputWithNetmaskComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class NfsFormComponent implements OnInit {
  private api = inject(ApiService);
  private formBuilder = inject(FormBuilder);
  private userService = inject(UserService);
  private translate = inject(TranslateService);
  private filesystemService = inject(FilesystemService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private datasetService = inject(DatasetService);
  private store$ = inject<Store<ServicesState>>(Store);
  slideInRef = inject<SlideInRef<{
    existingNfsShare?: NfsShare;
    defaultNfsShare?: NfsShare;
  } | undefined, boolean>>(SlideInRef);

  private validatorsService = inject(IxValidatorsService);

  existingNfsShare: NfsShare | undefined;
  defaultNfsShare: NfsShare | undefined;

  protected isLoading = signal(false);
  isAdvancedMode = false;
  hasNfsSecurityField = false;
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

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add NFS Share')
      : this.translate.instant('Edit NFS Share');
  }

  protected readonly requiredRoles = [Role.SharingNfsWrite, Role.SharingWrite];
  readonly helptext = helptextSharingNfs;
  readonly userProvider = new UserComboboxProvider(this.userService);
  readonly groupProvider = new GroupComboboxProvider(this.userService);
  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });
  readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));

  readonly securityOptions$ = of([
    {
      label: 'SYS',
      value: NfsSecurityProvider.Sys,
    },
    {
      label: 'KRB5',
      value: NfsSecurityProvider.Krb5,
    },
    {
      label: 'KRB5I',
      value: NfsSecurityProvider.Krb5i,
    },
    {
      label: 'KRB5P',
      value: NfsSecurityProvider.Krb5p,
    },
  ] as Option[]);

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.form.controls.path.addValidators(this.validatorsService.customValidator(
      getRootDatasetsValidator(this.existingNfsShare ? [this.existingNfsShare.path] : []),
      this.translate.instant('Sharing root datasets is not recommended. Please create a child dataset.'),
    ));
    this.existingNfsShare = this.slideInRef.getData()?.existingNfsShare;
    this.defaultNfsShare = this.slideInRef.getData()?.defaultNfsShare;
  }

  private setNfsShareForEdit(share: NfsShare): void {
    share.networks.forEach(() => this.addNetworkControl());
    share.hosts.forEach(() => this.addHostControl());
    this.form.patchValue(share);
  }

  ngOnInit(): void {
    this.checkForNfsSecurityField();

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
    this.isAdvancedMode = !this.isAdvancedMode;
  }

  protected onSubmit(): void {
    const nfsShare = { ...this.form.value } as NfsShareUpdate;

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
        untilDestroyed(this),
      ).subscribe({
        next: () => {
          if (this.isNew) {
            this.snackbar.success(this.translate.instant('NFS share created'));
          } else {
            this.snackbar.success(this.translate.instant('NFS share updated'));
          }
          this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.Nfs }));
          this.isLoading.set(false);
          this.slideInRef.close({ response: true });
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
  }

  private checkForNfsSecurityField(): void {
    this.api.call('nfs.config')
      .pipe(untilDestroyed(this))
      .subscribe((nfsConfig) => {
        this.hasNfsSecurityField = nfsConfig.protocols?.includes(NfsProtocol.V4);
      });
  }
}
