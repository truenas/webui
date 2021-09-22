import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, map } from 'rxjs/operators';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { ProductType } from 'app/enums/product-type.enum';
import helptext from 'app/helptext/services/components/service-nfs';
import { FormConfiguration, FormCustomAction } from 'app/interfaces/entity-form.interface';
import { NfsConfig } from 'app/interfaces/nfs-config.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { rangeValidator } from 'app/pages/common/entity/entity-form/validators/range-validation';
import { WebSocketService, DialogService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'nfs-edit',
  template: ' <entity-form [conf]="this"></entity-form>',
})

export class ServiceNFSComponent implements FormConfiguration {
  queryCall: 'nfs.config' = 'nfs.config';
  route_success: string[] = ['services'];
  productType = window.localStorage.getItem('product_type') as ProductType;
  hideOnScale = ['servers', 'allow_nonroot', 'mountd_log', 'statd_lockd_log'];
  title = helptext.formTitle;
  private v4krbValue: boolean;
  private hasNfsStatus: boolean;
  private adHealth: DirectoryServiceState;

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.nfs_srv_fieldset_general,
      label: true,
      config: [
        {
          type: 'input',
          name: 'servers',
          placeholder: helptext.nfs_srv_servers_placeholder,
          tooltip: helptext.nfs_srv_servers_tooltip,
          required: true,
          validation: helptext.nfs_srv_servers_validation,
        },
        {
          type: 'select',
          name: 'bindip',
          placeholder: helptext.nfs_srv_bindip_placeholder,
          tooltip: helptext.nfs_srv_bindip_tooltip,
          options: [],
          multiple: true,
        },
      ],
    },
    {
      name: 'divider',
      divider: true,
    },
    {
      name: helptext.nfs_srv_fieldset_v4,
      label: true,
      width: '50%',
      config: [
        {
          type: 'checkbox',
          name: 'v4',
          placeholder: helptext.nfs_srv_v4_placeholder,
          tooltip: helptext.nfs_srv_v4_tooltip,
          value: false,
        },
        {
          type: 'checkbox',
          name: 'v4_v3owner',
          placeholder: helptext.nfs_srv_v4_v3owner_placeholder,
          tooltip: helptext.nfs_srv_v4_v3owner_tooltip,
          relation: helptext.nfs_srv_v4_v3owner_relation,
        },
        {
          type: 'checkbox',
          name: 'v4_krb',
          placeholder: helptext.nfs_srv_v4_krb_placeholder,
          tooltip: helptext.nfs_srv_v4_krb_tooltip,
        },
      ],
    },
    {
      name: helptext.nfs_srv_fieldset_ports,
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: 'mountd_port',
          placeholder: helptext.nfs_srv_mountd_port_placeholder,
          tooltip: helptext.nfs_srv_mountd_port_tooltip,
          validation: [rangeValidator(1, 65535)],
        },
        {
          type: 'input',
          name: 'rpcstatd_port',
          placeholder: helptext.nfs_srv_rpcstatd_port_placeholder,
          tooltip: helptext.nfs_srv_rpcstatd_port_tooltip,
          validation: [rangeValidator(1, 65535)],
        },
        {
          type: 'input',
          name: 'rpclockd_port',
          placeholder: helptext.nfs_srv_rpclockd_port_placeholder,
          tooltip: helptext.nfs_srv_rpclockd_port_tooltip,
          validation: [rangeValidator(1, 65535)],
        },
      ],
    },
    {
      name: 'divider',
      divider: true,
    },
    {
      name: helptext.nfs_srv_fieldset_other,
      label: true,
      config: [
        {
          type: 'checkbox',
          name: 'udp',
          placeholder: helptext.nfs_srv_udp_placeholder,
          tooltip: helptext.nfs_srv_udp_tooltip,
        },
        {
          type: 'checkbox',
          name: 'allow_nonroot',
          placeholder: helptext.nfs_srv_allow_nonroot_placeholder,
          tooltip: helptext.nfs_srv_allow_nonroot_tooltip,
        },

        {
          type: 'checkbox',
          name: 'userd_manage_gids',
          placeholder: helptext.nfs_srv_16_placeholder,
          tooltip: helptext.nfs_srv_16_tooltip,
          relation: helptext.nfs_srv_16_relation,
        },
        {
          type: 'checkbox',
          name: 'mountd_log',
          placeholder: helptext.nfs_srv_mountd_log_placeholder,
          tooltip: helptext.nfs_srv_mountd_log_tooltip,
        },
        {
          type: 'checkbox',
          name: 'statd_lockd_log',
          placeholder: helptext.nfs_srv_statd_lockd_log_placeholder,
          tooltip: helptext.nfs_srv_statd_lockd_log_tooltip,
        },
      ],
    },
    {
      name: 'divider',
      divider: true,
    },
  ];

  private ipChoices$ = this.ws.call('nfs.bindip_choices')
    .pipe(
      map((ips: { [ip: string]: string }) =>
        Object.keys(ips || {}).map((key) => ({ label: key, value: key }))),
    );
  private validBindIps: string[] = [];

  custActions: FormCustomAction[] = [
    {
      id: 'has_nfs_status',
      name: helptext.addSPN.btnTxt,
      function: () => {
        this.addSPN();
      },
    },
  ];

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    private dialog: DialogService,
  ) {}

  resourceTransformIncomingRestData(data: NfsConfig): NfsConfig {
    this.v4krbValue = data.v4_krb;
    // If validIps is slow to load, skip check on load (It's still done on save)
    if (this.validBindIps?.length) {
      return this.compareBindIps(data);
    }
    return data;
  }

  isCustActionVisible(actionname: string): boolean {
    if (
      actionname === 'has_nfs_status'
      && (!this.hasNfsStatus && this.v4krbValue && this.adHealth === DirectoryServiceState.Healthy)
    ) {
      return true;
    }
    return false;
  }

  compareBindIps(data: NfsConfig): NfsConfig {
    // Weeds out invalid addresses (ie, ones that have changed). Called on load and on save.
    data.bindip = data.bindip ? data.bindip : [];
    if (this.validBindIps && this.validBindIps.length > 0) {
      data.bindip.forEach((ip) => {
        if (!this.validBindIps.includes(ip)) {
          data.bindip.splice((data.bindip as any)[ip], 1);
        }
      });
    } else {
      data.bindip = [];
    }
    return data;
  }

  afterInit(entityForm: EntityFormComponent): void {
    if (this.productType.includes(ProductType.Scale)) {
      this.hideOnScale.forEach((name) => {
        entityForm.setDisabled(name, true, true);
      });
    }
    entityForm.submitFunction = (body) => this.ws.call('nfs.update', [body]);

    this.ipChoices$.pipe(untilDestroyed(this)).subscribe((ipChoices) => {
      ipChoices.forEach((ip) => {
        this.validBindIps.push(ip.value);
      });
      const config: FormSelectConfig = this.fieldSets
        .find((set) => set.name === helptext.nfs_srv_fieldset_general)
        .config.find((config) => config.name === 'bindip');
      config.options = ipChoices;
    });

    entityForm.formGroup.controls['v4_v3owner'].valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      if (value) {
        entityForm.formGroup.controls['userd_manage_gids'].setValue(false);
      }
    });

    entityForm.formGroup.controls['v4_krb'].valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      this.v4krbValue = !!value;
    });

    this.ws.call('kerberos.keytab.has_nfs_principal').pipe(untilDestroyed(this)).subscribe((res) => {
      this.hasNfsStatus = res;
      if (!this.hasNfsStatus) {
        this.ws.call('directoryservices.get_state').pipe(untilDestroyed(this)).subscribe(({ activedirectory }) => {
          this.adHealth = activedirectory;
        });
      }
    });
  }

  beforeSubmit(data: any): void {
    if (!data.userd_manage_gids) {
      data.userd_manage_gids = false;
    }

    for (const prop of ['mountd_port', 'rpcstatd_port', 'rpclockd_port']) {
      if (data[prop] === '') {
        data[prop] = null;
      }
    }
    data = this.compareBindIps(data);
  }

  afterSave(entityForm: EntityFormComponent): void {
    this.router.navigate(this.route_success);
    if (entityForm.formGroup.value.v4_krb && !this.v4krbValue) {
      this.addSPN();
    }
  }

  addSPN(): void {
    const that = this;
    if (!this.hasNfsStatus && this.adHealth === DirectoryServiceState.Healthy) {
      this.dialog.confirm({
        title: helptext.add_principal_prompt.title,
        message: helptext.add_principal_prompt.message,
        hideCheckBox: true,
        buttonMsg: helptext.add_principal_prompt.affirmative,
        cancelMsg: helptext.add_principal_prompt.negative,
      }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        this.dialog.dialogForm(
          {
            title: helptext.add_principal_prompt.title,
            fieldConfig: [
              {
                type: 'input',
                name: 'username',
                placeholder: helptext.add_principal_form.username,
                required: true,
              },
              {
                type: 'input',
                name: 'password',
                inputType: 'password',
                togglePw: true,
                placeholder: helptext.add_principal_form.password,
                required: true,
              },
            ],
            saveButtonText: helptext.add_principal_form.action,
            customSubmit(entityDialog: EntityDialogComponent) {
              const value = entityDialog.formValue;
              const self = entityDialog;
              self.loader.open();
              self.ws.call('nfs.add_principal', [{ username: value.username, password: value.password }])
                .pipe(untilDestroyed(this)).subscribe(() => {
                  self.loader.close();
                  self.dialogRef.close(true);
                  that.dialog.info(helptext.addSPN.success, helptext.addSPN.success_msg, '500px', 'info');
                },
                (err: WebsocketError) => {
                  self.loader.close();
                  self.dialogRef.close(true);
                  that.dialog.errorReport(helptext.add_principal_form.error_title,
                    err.reason, err.trace.formatted);
                });
            },
          },
        );
      });
    }
  }
}
