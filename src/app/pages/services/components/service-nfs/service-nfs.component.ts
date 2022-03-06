import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { choicesToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/services/components/service-nfs';
import { rangeValidator, portRangeValidator } from 'app/modules/entity/entity-form/validators/range-validation';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService, WebSocketService } from 'app/services';
import { EntityUtils } from '../../../../modules/entity/utils';

@UntilDestroy()
@Component({
  templateUrl: './service-nfs.component.html',
  styleUrls: ['./service-nfs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceNfsComponent implements OnInit {
  isFormLoading = false;

  form = this.fb.group({
    allow_nonroot: [false],
    bindip: [[] as string[]],
    servers: [4, [Validators.required, rangeValidator(1, 256)]],
    v4: [false],
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
    v4: helptext.nfs_srv_v4_tooltip,
    v4_v3owner: helptext.nfs_srv_v4_v3owner_tooltip,
    v4_krb: helptext.nfs_srv_v4_krb_tooltip,
    mountd_port: helptext.nfs_srv_mountd_port_tooltip,
    rpcstatd_port: helptext.nfs_srv_rpcstatd_port_tooltip,
    rpclockd_port: helptext.nfs_srv_rpclockd_port_tooltip,
    udp: helptext.nfs_srv_udp_tooltip,
    userd_manage_gids: helptext.nfs_srv_16_tooltip,
  };

  readonly ipChoices$ = this.ws.call('nfs.bindip_choices').pipe(choicesToOptions());

  constructor(
    private ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private translate: TranslateService,
    private dialogService: DialogService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;
    this.loadConfig();
    this.setFieldDependencies();
  }

  onSubmit(): void {
    const values = this.form.value;
    const params = {
      ...this.form.value,
      mountd_port: values.mountd_port ? Number(values.mountd_port) : null,
      rpcstatd_port: values.rpcstatd_port ? Number(values.rpcstatd_port) : null,
      rpclockd_port: values.rpclockd_port ? Number(values.rpclockd_port) : null,
      servers: Number(values.servers),
    };

    this.isFormLoading = true;
    this.ws.call('nfs.update', [params])
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
          this.router.navigate(['/services']);
        },
        (error) => {
          this.isFormLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      );
  }

  onCancel(): void {
    this.router.navigate(['/services']);
  }

  private loadConfig(): void {
    this.ws.call('nfs.config')
      .pipe(untilDestroyed(this))
      .subscribe(
        (config) => {
          this.form.patchValue(config);
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
        (error) => {
          new EntityUtils().handleWsError(null, error, this.dialogService);
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
      );
  }

  private setFieldDependencies(): void {
    this.form.controls['v4'].valueChanges.pipe(untilDestroyed(this)).subscribe((nsf4Enabled) => {
      if (!nsf4Enabled) {
        this.form.patchValue({ v4_v3owner: false });
      }

      this.form.controls['v4_v3owner'].setEnable(nsf4Enabled);
    });

    this.form.controls['v4_v3owner'].valueChanges.pipe(untilDestroyed(this)).subscribe((v3Owner) => {
      if (v3Owner) {
        this.form.patchValue({ userd_manage_gids: false });
      }
      this.form.controls['userd_manage_gids'].setEnable(!v3Owner);
    });
  }
}
