import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { NfsProtocol, nfsProtocolLabels } from 'app/enums/nfs-protocol.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/services/components/service-nfs';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { rangeValidator, portRangeValidator } from 'app/modules/ix-forms/validators/range-validation/range-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AddSpnDialogComponent } from 'app/pages/services/components/service-nfs/add-spn-dialog/add-spn-dialog.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './service-nfs.component.html',
  styleUrls: ['./service-nfs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceNfsComponent implements OnInit {
  isFormLoading = false;
  isAddSpnDisabled = true;
  hasNfsStatus: boolean;
  adHealth: DirectoryServiceState;

  form = this.fb.group({
    allow_nonroot: [false],
    bindip: [[] as string[]],
    servers: [4, [Validators.required, rangeValidator(1, 256)]],
    protocols: [[NfsProtocol.V3], Validators.required],
    v4_v3owner: [false],
    v4_krb: [false],
    mountd_port: [null as number, portRangeValidator()],
    rpcstatd_port: [null as number, portRangeValidator()],
    rpclockd_port: [null as number, portRangeValidator()],
    udp: [false],
    userd_manage_gids: [false],
  });

  readonly tooltips = {
    allow_nonroot: helptext.nfs_srv_allow_nonroot_tooltip,
    bindip: helptext.nfs_srv_bindip_tooltip,
    servers: helptext.nfs_srv_servers_tooltip,
    v4_v3owner: helptext.nfs_srv_v4_v3owner_tooltip,
    v4_krb: helptext.nfs_srv_v4_krb_tooltip,
    mountd_port: helptext.nfs_srv_mountd_port_tooltip,
    rpcstatd_port: helptext.nfs_srv_rpcstatd_port_tooltip,
    rpclockd_port: helptext.nfs_srv_rpclockd_port_tooltip,
    udp: helptext.nfs_srv_udp_tooltip,
    userd_manage_gids: helptext.nfs_srv_16_tooltip,
  };

  readonly ipChoices$ = this.ws.call('nfs.bindip_choices').pipe(choicesToOptions());
  readonly protocolOptions$ = of(mapToOptions(nfsProtocolLabels, this.translate));

  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private translate: TranslateService,
    private dialogService: DialogService,
    private snackbar: SnackbarService,
    private matDialog: MatDialog,
    private slideInRef: IxSlideInRef<ServiceNfsComponent>,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;
    this.loadConfig();
    this.loadState();
    this.setFieldDependencies();
  }

  onSubmit(): void {
    const params = this.form.value;

    this.isFormLoading = true;
    this.ws.call('nfs.update', [params])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isFormLoading = false;
          this.snackbar.success(this.translate.instant('Service configuration saved'));
          this.slideInRef.close();
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isFormLoading = false;
          this.formErrorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }

  private loadConfig(): void {
    this.ws.call('nfs.config')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (config) => {
          this.isAddSpnDisabled = !config.v4_krb;
          this.form.patchValue(config);
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: WebsocketError) => {
          this.dialogService.error(this.errorHandler.parseWsError(error));
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private setFieldDependencies(): void {
    this.form.controls.protocols.valueChanges.pipe(untilDestroyed(this)).subscribe((protocols) => {
      const nsf4Enabled = protocols.includes(NfsProtocol.V4);
      if (!nsf4Enabled) {
        this.form.patchValue({ v4_v3owner: false });
      }

      if (nsf4Enabled) {
        this.form.controls.v4_v3owner.enable();
      } else {
        this.form.controls.v4_v3owner.disable();
      }
    });

    this.form.controls.v4_v3owner.valueChanges.pipe(untilDestroyed(this)).subscribe((v3Owner) => {
      if (v3Owner) {
        this.form.patchValue({ userd_manage_gids: false });
      }

      if (v3Owner) {
        this.form.controls.userd_manage_gids.disable();
      } else {
        this.form.controls.userd_manage_gids.enable();
      }
    });
  }

  private loadState(): void {
    forkJoin([
      this.ws.call('kerberos.keytab.has_nfs_principal'),
      this.ws.call('directoryservices.get_state'),
    ])
      .pipe(untilDestroyed(this))
      .subscribe(([nfsStatus, { activedirectory }]) => {
        this.hasNfsStatus = nfsStatus;
        this.adHealth = activedirectory;
      });
  }

  get isAddSpnVisible(): boolean {
    if (!this.hasNfsStatus && this.form.value.v4_krb && this.adHealth === DirectoryServiceState.Healthy) {
      return true;
    }
    return false;
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
