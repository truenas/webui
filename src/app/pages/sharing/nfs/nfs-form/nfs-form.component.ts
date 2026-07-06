import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject, input,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
  TnSelectComponent,
} from '@truenas/ui-components';
import {
  Observable, filter, of, switchMap,
} from 'rxjs';
import { DatasetPreset } from 'app/enums/dataset.enum';
import { NfsProtocol } from 'app/enums/nfs-protocol.enum';
import { NfsSecurityProvider } from 'app/enums/nfs-security-provider.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextSharingNfs } from 'app/helptext/sharing';
import { DatasetCreate } from 'app/interfaces/dataset.interface';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { Option } from 'app/interfaces/option.interface';
import { ExplorerCreateDatasetComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxGroupComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-group-combobox/ix-group-combobox.component';
import { IxIpInputWithNetmaskComponent } from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxUserComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-user-combobox/ix-user-combobox.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { ipv4or6cidrValidator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { ApiService } from 'app/modules/websocket/api.service';
import { getRootDatasetsValidator } from 'app/pages/sharing/utils/root-datasets-validator';
import { DatasetService } from 'app/services/dataset/dataset.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

/** Edit/default data supplied either by the legacy SlideIn host (via `getData()`) or the panel host (input). */
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
    TnButtonComponent,
    IxExplorerComponent,
    ExplorerCreateDatasetComponent,
    IxUserComboboxComponent,
    IxGroupComboboxComponent,
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
  private store$ = inject<Store<ServicesState>>(Store);

  private validatorsService = inject(IxValidatorsService);
  private destroyRef = inject(DestroyRef);

  /** Edit/default data supplied by the `<tn-side-panel>` host. */
  readonly nfsShareData = input<NfsFormData | undefined>(undefined);

  existingNfsShare: NfsShare | undefined;
  defaultNfsShare: NfsShare | undefined;

  protected isAdvancedMode = signal(false);
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

  readonly requiredRoles = [Role.SharingNfsWrite, Role.SharingWrite];
  readonly helptext = helptextSharingNfs;
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

  private checkForNfsSecurityField(): void {
    this.api.call('nfs.config')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((nfsConfig) => {
        this.hasNfsSecurityField = nfsConfig.protocols?.includes(NfsProtocol.V4);
      });
  }
}
