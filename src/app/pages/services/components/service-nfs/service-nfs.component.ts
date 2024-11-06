import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, signal,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  finalize, forkJoin, Observable, of, tap,
} from 'rxjs';
import { map, take } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { NfsProtocol, nfsProtocolLabels } from 'app/enums/nfs-protocol.enum';
import { Role } from 'app/enums/role.enum';
import { RdmaProtocolName } from 'app/enums/service-name.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextServiceNfs } from 'app/helptext/services/components/service-nfs';
import { DirectoryServicesState } from 'app/interfaces/directory-services-state.interface';
import { NfsConfig } from 'app/interfaces/nfs-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { rangeValidator, portRangeValidator } from 'app/modules/forms/ix-forms/validators/range-validation/range-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { AddSpnDialogComponent } from 'app/pages/services/components/service-nfs/add-spn-dialog/add-spn-dialog.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-service-nfs',
  templateUrl: './service-nfs.component.html',
  styleUrls: ['./service-nfs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    IxInputComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TooltipComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class ServiceNfsComponent implements OnInit {
  protected readonly isFormLoading = signal(false);
  protected readonly isAddSpnDisabled = signal(true);
  protected readonly hasNfsStatus = signal(false);
  protected activeDirectoryState = signal<DirectoryServiceState | null>(null);

  protected form = this.fb.group({
    allow_nonroot: [false],
    bindip: [[] as string[]],
    servers_auto: [true],
    servers: [null as number, [rangeValidator(1, 256), this.validatorsService.validateOnCondition(
      (control) => !control.parent?.get('servers_auto')?.value,
      Validators.required,
    )]],
    protocols: [[NfsProtocol.V3], Validators.required],
    v4_domain: [''],
    v4_krb: [false],
    mountd_port: [null as number, portRangeValidator()],
    rpcstatd_port: [null as number, portRangeValidator()],
    rpclockd_port: [null as number, portRangeValidator()],
    userd_manage_gids: [false],
    rdma: [false],
  });

  readonly tooltips = {
    allow_nonroot: helptextServiceNfs.nfs_srv_allow_nonroot_tooltip,
    bindip: helptextServiceNfs.nfs_srv_bindip_tooltip,
    servers: helptextServiceNfs.nfs_srv_servers_tooltip,
    servers_auto: helptextServiceNfs.nfs_srv_servers_auto_tooltip,
    v4_domain: helptextServiceNfs.nfs_srv_v4_domain_tooltip,
    protocols: helptextServiceNfs.nfs_srv_protocols_tooltip,
    v4_krb: helptextServiceNfs.nfs_srv_v4_krb_tooltip,
    mountd_port: helptextServiceNfs.nfs_srv_mountd_port_tooltip,
    rpcstatd_port: helptextServiceNfs.nfs_srv_rpcstatd_port_tooltip,
    rpclockd_port: helptextServiceNfs.nfs_srv_rpclockd_port_tooltip,
    userd_manage_gids: helptextServiceNfs.userd_manage_gids,
  };

  readonly ipChoices$ = this.ws.call('nfs.bindip_choices').pipe(choicesToOptions());

  readonly protocolOptions$ = of(mapToOptions(nfsProtocolLabels, this.translate));
  readonly requiredRoles = [Role.SharingNfsWrite, Role.SharingWrite];

  private readonly v4SpecificFields = ['v4_domain', 'v4_krb'] as const;

  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private fb: FormBuilder,
    private store$: Store<AppState>,
    private translate: TranslateService,
    private dialogService: DialogService,
    private snackbar: SnackbarService,
    private matDialog: MatDialog,
    private slideInRef: SlideInRef<ServiceNfsComponent>,
    private validatorsService: IxValidatorsService,
  ) {}

  ngOnInit(): void {
    this.isFormLoading.set(true);
    forkJoin([
      this.loadConfig(),
      this.checkForRdmaSupport(),
      this.loadActiveDirectoryState(),
    ])
      .pipe(
        this.errorHandler.catchError(),
        finalize(() => this.isFormLoading.set(false)),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.setFieldDependencies();
      });
  }

  onSubmit(): void {
    const params = this.form.getRawValue();

    if (params.servers_auto) {
      params.servers = null;
    }

    delete params.servers_auto;

    this.isFormLoading.set(true);
    this.ws.call('nfs.update', [params])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isFormLoading.set(false);
          this.snackbar.success(this.translate.instant('Service configuration saved'));
          this.slideInRef.close(true);
        },
        error: (error: unknown) => {
          this.isFormLoading.set(false);
          this.formErrorHandler.handleWsFormError(error, this.form);
        },
      });
  }

  private loadConfig(): Observable<NfsConfig> {
    return this.ws.call('nfs.config')
      .pipe(
        tap((config) => {
          this.isAddSpnDisabled.set(!config.v4_krb);
          this.hasNfsStatus.set(config.keytab_has_nfs_spn);
          this.form.patchValue({
            ...config,
            servers_auto: config.managed_nfsd,
          });
        }),
      );
  }

  private checkForRdmaSupport(): Observable<void> {
    return forkJoin([
      this.ws.call('rdma.capable_protocols'),
      this.store$.select(selectIsEnterprise).pipe(take(1)),
    ]).pipe(
      map(([capableProtocols, isEnterprise]) => {
        const hasRdmaSupport = capableProtocols.includes(RdmaProtocolName.Nfs) && isEnterprise;
        if (hasRdmaSupport) {
          this.form.controls.rdma.enable();
        } else {
          this.form.controls.rdma.disable();
        }

        return undefined;
      }),
    );
  }

  private loadActiveDirectoryState(): Observable<DirectoryServicesState> {
    return this.ws.call('directoryservices.get_state').pipe(
      tap(({ activedirectory }) => {
        this.activeDirectoryState.set(activedirectory);
      }),
    );
  }

  private setFieldDependencies(): void {
    this.form.controls.protocols.valueChanges.pipe(untilDestroyed(this)).subscribe((protocols) => {
      const nfs4Enabled = protocols.includes(NfsProtocol.V4);
      if (!nfs4Enabled) {
        this.form.patchValue({
          v4_domain: '',
        });
      }

      this.v4SpecificFields.forEach((field) => {
        if (nfs4Enabled) {
          this.form.controls[field].enable();
        } else {
          this.form.controls[field].disable();
        }
      });
    });
  }

  get isAddSpnVisible(): boolean {
    return !this.hasNfsStatus()
      && this.form.value.v4_krb
      && this.activeDirectoryState() === DirectoryServiceState.Healthy;
  }

  addSpn(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Add Kerberos SPN Entry'),
      message: this.translate.instant('Would you like to add a Service Principal Name (SPN) now?'),
      hideCheckbox: true,
      buttonText: this.translate.instant('Yes'),
      cancelText: this.translate.instant('No'),
    }).pipe(untilDestroyed(this)).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.matDialog.open(AddSpnDialogComponent);
    });
  }
}
