import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { DatasetPreset } from 'app/enums/dataset.enum';
import { NfsProtocol } from 'app/enums/nfs-protocol.enum';
import { NfsSecurityProvider } from 'app/enums/nfs-security-provider.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextSharingNfs } from 'app/helptext/sharing';
import { DatasetCreate } from 'app/interfaces/dataset.interface';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { GroupComboboxProvider } from 'app/modules/ix-forms/classes/group-combobox-provider';
import { UserComboboxProvider } from 'app/modules/ix-forms/classes/user-combobox-provider';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { ipv4or6cidrValidator } from 'app/modules/ix-forms/validators/ip-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { UserService } from 'app/services/user.service';
import { WebSocketService } from 'app/services/ws.service';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { ServicesState } from 'app/store/services/services.reducer';

@UntilDestroy()
@Component({
  templateUrl: './nfs-form.component.html',
  styleUrls: ['./nfs-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NfsFormComponent implements OnInit {
  existingNfsShare: NfsShare;
  defaultNfsShare: NfsShare;

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

  readonly requiredRoles = [Role.SharingNfsWrite, Role.SharingWrite];
  readonly helptext = helptextSharingNfs;
  readonly userProvider = new UserComboboxProvider(this.userService);
  readonly groupProvider = new GroupComboboxProvider(this.userService);
  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });

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
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private userService: UserService,
    private translate: TranslateService,
    private filesystemService: FilesystemService,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
    private slideInRef: IxSlideInRef<NfsFormComponent>,
    private store$: Store<ServicesState>,
    @Inject(SLIDE_IN_DATA) private data: { existingNfsShare?: NfsShare; defaultNfsShare?: NfsShare },
  ) {
    this.existingNfsShare = this.data?.existingNfsShare;
    this.defaultNfsShare = this.data?.defaultNfsShare;
  }

  setNfsShareForEdit(): void {
    this.existingNfsShare.networks.forEach(() => this.addNetworkControl());
    this.existingNfsShare.hosts.forEach(() => this.addHostControl());
    this.form.patchValue(this.existingNfsShare);
  }

  ngOnInit(): void {
    this.checkForNfsSecurityField();

    if (this.defaultNfsShare) {
      this.form.patchValue(this.defaultNfsShare);
    }

    if (this.existingNfsShare) {
      this.setNfsShareForEdit();
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
    this.isLoading = true;
    this.cdr.markForCheck();
    const nfsShare = this.form.value;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('sharing.nfs.create', [nfsShare]);
    } else {
      request$ = this.ws.call('sharing.nfs.update', [this.existingNfsShare.id, nfsShare]);
    }

    request$
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          if (this.isNew) {
            this.snackbar.success(this.translate.instant('NFS share created'));
          } else {
            this.snackbar.success(this.translate.instant('NFS share updated'));
          }
          this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.Nfs }));
          this.isLoading = false;
          this.cdr.markForCheck();
          this.slideInRef.close(true);
        },
        error: (error: unknown) => {
          this.isLoading = false;
          this.formErrorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }

  private checkForNfsSecurityField(): void {
    this.ws.call('nfs.config')
      .pipe(untilDestroyed(this))
      .subscribe((nfsConfig) => {
        this.hasNfsSecurityField = nfsConfig.protocols?.includes(NfsProtocol.V4);
      });
  }
}
