import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { NfsProtocol } from 'app/enums/nfs-protocol.enum';
import { NfsSecurityProvider } from 'app/enums/nfs-security-provider.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextSharingNfs, shared } from 'app/helptext/sharing';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { GroupComboboxProvider } from 'app/modules/ix-forms/classes/group-combobox-provider';
import { UserComboboxProvider } from 'app/modules/ix-forms/classes/user-combobox-provider';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { ipv4or6cidrValidator } from 'app/modules/ix-forms/validators/ip-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { UserService } from 'app/services/user.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './nfs-form.component.html',
  styleUrls: ['./nfs-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NfsFormComponent implements OnInit {
  isLoading = false;
  isAdvancedMode = false;
  hasNfsSecurityField = false;

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
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private filesystemService: FilesystemService,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
    private slideInRef: IxSlideInRef<NfsFormComponent>,
    @Inject(SLIDE_IN_DATA) private existingNfsShare: NfsShare,
  ) {}

  setNfsShareForEdit(): void {
    this.existingNfsShare.networks.forEach(() => this.addNetworkControl());
    this.existingNfsShare.hosts.forEach(() => this.addHostControl());
    this.form.patchValue(this.existingNfsShare);
  }

  ngOnInit(): void {
    this.checkForNfsSecurityField();

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
      .pipe(
        switchMap(() => this.checkIfNfsServiceIsEnabled()),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          if (this.isNew) {
            this.snackbar.success(this.translate.instant('NFS share created'));
          } else {
            this.snackbar.success(this.translate.instant('NFS share updated'));
          }
          this.isLoading = false;
          this.cdr.markForCheck();
          this.slideInRef.close();
        },
        error: (error) => {
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

  private checkIfNfsServiceIsEnabled(): Observable<void> {
    return this.ws.call('service.query').pipe(
      switchMap((services) => {
        const nfsService = services.find((service) => service.service === ServiceName.Nfs);
        if (nfsService.enable) {
          return of(null);
        }

        return this.startNfsService();
      }),
    );
  }

  private startNfsService(): Observable<void> {
    return this.dialogService.confirm({
      title: shared.dialog_title,
      message: shared.dialog_message,
      hideCheckbox: true,
      buttonText: shared.dialog_button,
    }).pipe(
      switchMap((confirmed) => {
        if (!confirmed) {
          return of(null);
        }

        return this.ws.call('service.update', [ServiceName.Nfs, { enable: true }]).pipe(
          switchMap(() => this.ws.call('service.start', [ServiceName.Nfs, { silent: false }])),
          map(() => {
            this.snackbar.success(
              this.translate.instant('The {service} service has been enabled.', { service: 'NFS' }),
            );

            return undefined;
          }),
          this.errorHandler.catchError(),
        );
      }),
    );
  }
}
