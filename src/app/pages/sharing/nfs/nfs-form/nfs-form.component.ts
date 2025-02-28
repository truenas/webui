import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
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
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { GroupComboboxProvider } from 'app/modules/forms/ix-forms/classes/group-combobox-provider';
import { UserComboboxProvider } from 'app/modules/forms/ix-forms/classes/user-combobox-provider';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxIpInputWithNetmaskComponent } from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ipv4or6cidrValidator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetService } from 'app/services/dataset-service/dataset.service';
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
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxExplorerComponent,
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
  existingNfsShare: NfsShare | undefined;
  defaultNfsShare: NfsShare | undefined;

  isLoading = false;
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
  ]);

  constructor(
    private api: ApiService,
    private formBuilder: FormBuilder,
    private userService: UserService,
    private translate: TranslateService,
    private filesystemService: FilesystemService,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
    private datasetService: DatasetService,
    private store$: Store<ServicesState>,
    public slideInRef: SlideInRef<{ existingNfsShare?: NfsShare; defaultNfsShare?: NfsShare } | undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.existingNfsShare = this.slideInRef.getData()?.existingNfsShare;
    this.defaultNfsShare = this.slideInRef.getData()?.defaultNfsShare;
  }

  setNfsShareForEdit(share: NfsShare): void {
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

  addNetworkControl(): void {
    this.form.controls.networks.push(this.formBuilder.control('', [Validators.required, ipv4or6cidrValidator()]));
  }

  removeNetworkControl(index: number): void {
    this.form.controls.networks.removeAt(index);
  }

  addHostControl(): void {
    this.form.controls.hosts.push(this.formBuilder.control('', Validators.required));
  }

  removeHostControl(index: number): void {
    this.form.controls.hosts.removeAt(index);
  }

  toggleAdvancedMode(): void {
    this.isAdvancedMode = !this.isAdvancedMode;
  }

  onSubmit(): void {
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
      this.translate.instant(helptextSharingNfs.root_level_warning),
      !this.form.controls.path.dirty,
    )
      .pipe(
        filter(Boolean),
        tap(() => {
          this.isLoading = true;
          this.cdr.markForCheck();
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
          this.isLoading = false;
          this.cdr.markForCheck();
          this.slideInRef.close({ response: true, error: null });
        },
        error: (error: unknown) => {
          this.isLoading = false;
          this.formErrorHandler.handleValidationErrors(error, this.form);
          this.cdr.markForCheck();
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
