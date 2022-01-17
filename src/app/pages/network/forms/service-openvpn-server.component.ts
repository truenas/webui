import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import helptext from 'app/helptext/services/components/service-openvpn';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { OpenvpnServerConfig, OpenvpnServerConfigUpdate } from 'app/interfaces/openvpn-server-config.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/modules/entity/entity-form/models/relation-action.enum';
import {
  ServicesService, DialogService, AppLoaderService, WebSocketService, StorageService,
} from 'app/services';

@UntilDestroy()
@Component({
  selector: 'openvpn-server',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class OpenvpnServerComponent implements FormConfiguration {
  queryCall = 'openvpn.server.config' as const;
  protected certificateId: number;
  protected serverAddress: string;
  protected entityEdit: EntityFormComponent;
  dialogConf: DialogFormConfiguration;
  protected certOptions: Option[];
  title = helptext.server.formTitle;
  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: 'server-settings',
      label: false,
      config: [
        {
          type: 'select',
          name: 'server_certificate',
          placeholder: helptext.certificate.server_placeholder,
          tooltip: helptext.certificate.tooltip,
          options: [],
          required: true,
        },
        {
          type: 'select',
          name: 'root_ca',
          placeholder: helptext.root_ca.placeholder,
          tooltip: helptext.root_ca.tooltip,
          options: [],
          required: true,
        },
        {
          type: 'ipwithnetmask',
          name: 'server',
          placeholder: helptext.server.server.placeholder,
          tooltip: helptext.server.server.tooltip,
          required: true,
        },
        {
          type: 'input',
          name: 'port',
          inputType: 'number',
          placeholder: helptext.port.placeholder,
          tooltip: helptext.port.tooltip,
        },
        {
          type: 'select',
          name: 'authentication_algorithm',
          placeholder: helptext.authentication_algorithm.placeholder,
          tooltip: helptext.authentication_algorithm.tooltip,
          options: [{ label: '---', value: null }],
        },
        {
          type: 'select',
          name: 'cipher',
          placeholder: helptext.cipher.placeholder,
          tooltip: helptext.cipher.tooltip,
          options: [{ label: '---', value: null }],
        },
        {
          type: 'select',
          name: 'compression',
          placeholder: helptext.compression.placeholder,
          tooltip: helptext.compression.tooltip,
          options: helptext.compression.enum,
        },
        {
          type: 'select',
          name: 'protocol',
          placeholder: helptext.protocol.placeholder,
          tooltip: helptext.protocol.tooltip,
          options: helptext.protocol.enum,
        },
      ],
    },
    {
      name: 'client-server-settings',
      label: false,
      config: [
        {
          type: 'select',
          name: 'device_type',
          placeholder: helptext.device_type.placeholder,
          tooltip: helptext.device_type.tooltip,
          options: helptext.device_type.enum,
        },
        {
          type: 'select',
          name: 'topology',
          placeholder: helptext.server.topology.placeholder,
          tooltip: helptext.server.topology.tooltip,
          options: helptext.server.topology.enum,
          relation: [
            {
              action: RelationAction.Disable,
              when: [{
                name: 'device_type',
                value: 'TAP',
              }],
            },
          ],
        },
        {
          type: 'checkbox',
          name: 'tls_crypt_auth_enabled',
          placeholder: helptext.tls_crypt_auth_enabled.placeholder,
          tooltip: helptext.tls_crypt_auth_enabled.tooltip,
        },
        {
          type: 'textarea',
          name: 'additional_parameters',
          placeholder: helptext.additional_parameters.placeholder,
          tooltip: helptext.additional_parameters.tooltip,
          textAreaRows: 6,
        },
        {
          type: 'textarea',
          name: 'tls_crypt_auth',
          placeholder: helptext.server.tls_crypt_auth.placeholder,
          tooltip: helptext.server.tls_crypt_auth.tooltip,
          textAreaRows: 8,
        },
      ],
    },
  ];

  custActions = [
    {
      id: 'renew_key',
      name: helptext.server.buttons.renew,
      function: () => {
        this.loader.open();
        this.services.renewStaticKey().pipe(untilDestroyed(this)).subscribe((res) => {
          let msg = '';
          for (const item in res) {
            msg += `${item}: ${res[item as keyof OpenvpnServerConfig]} \n`;
          }
          this.loader.close();
          this.entityEdit.formGroup.controls['tls_crypt_auth'].setValue(res.tls_crypt_auth);
          const filename = 'openVPNStatic.key';
          const blob = new Blob([msg], { type: 'text/plain' });
          this.storageService.downloadBlob(blob, filename);
        }, (err) => {
          this.loader.close();
          this.dialog.errorReport(helptext.error_dialog_title, err.reason, err.trace.formatted);
        });
      },
    },
    {
      id: 'client_config',
      name: helptext.server.buttons.download,
      function: () => {
        const conf: DialogFormConfiguration = {
          title: this.translate.instant('Select Client Certificate'),
          fieldConfig: [
            {
              type: 'select',
              name: 'client_certificate_id',
              placeholder: 'Client Certificate',
              options: this.certOptions,
            },
          ],
          saveButtonText: this.translate.instant('Save'),
          customSubmit: (entityDialog: EntityDialogComponent) => {
            this.ws.call('interface.websocket_local_ip').pipe(untilDestroyed(this)).subscribe((localip) => {
              const value = entityDialog.formValue;
              entityDialog.dialogRef.close(true);
              this.loader.open();
              this.services.generateOpenServerClientConfig(value.client_certificate_id,
                localip).pipe(untilDestroyed(this)).subscribe((key) => {
                const filename = 'openVPNClientConfig.ovpn';
                const blob = new Blob([key], { type: 'text/plain' });
                this.storageService.downloadBlob(blob, filename);
                this.loader.close();
              }, (err) => {
                this.loader.close();
                this.dialog.errorReport(helptext.error_dialog_title, err.reason, err.trace.formatted);
              });
            });
          },
        };
        this.dialog.dialogForm(conf);
      },
    },
  ];

  constructor(
    protected services: ServicesService,
    protected dialog: DialogService,
    protected loader: AppLoaderService,
    protected ws: WebSocketService,
    protected storageService: StorageService,
    protected translate: TranslateService,
  ) { }

  resourceTransformIncomingRestData(data: OpenvpnServerConfig): OpenvpnServerConfig {
    data.server = `${data.server}/${data.netmask}`;
    return data;
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityEdit = entityEdit;
    entityEdit.submitFunction = (body: OpenvpnServerConfigUpdate) => {
      return this.services.updateOpenVpn('openvpn.server.update', body);
    };

    this.services.getClientInfo().pipe(untilDestroyed(this)).subscribe((res) => {
      this.certificateId = res.client_certificate;
    });

    this.services.getOpenVpnServerAuthAlgorithmChoices().pipe(untilDestroyed(this)).subscribe((res) => {
      const config = this.fieldConfig.find((c) => c.name === 'authentication_algorithm') as FormSelectConfig;
      for (const item in res) {
        config.options.push(
          { label: `${item} (${res[item]})`, value: item },
        );
      }
    });
    this.services.getOpenServerCipherChoices().pipe(untilDestroyed(this)).subscribe((res) => {
      const config = this.fieldConfig.find((c) => c.name === 'cipher') as FormSelectConfig;
      for (const item in res) {
        config.options.push(
          { label: `${item} ${res[item]}`, value: item },
        );
      }
    });
    this.services.getCerts().pipe(untilDestroyed(this)).subscribe((certificates) => {
      const config = this.fieldConfig.find((c) => c.name === 'server_certificate') as FormSelectConfig;
      certificates.forEach((certificate) => {
        config.options.push({ label: certificate.name, value: certificate.id });
      });
      this.certOptions = config.options;
    });
    this.services.getCertificateAuthorities().pipe(untilDestroyed(this)).subscribe((authorities) => {
      const config = this.fieldConfig.find((c) => c.name === 'root_ca') as FormSelectConfig;
      authorities.forEach((item) => {
        config.options.push({ label: item.name, value: item.id });
      });
    });
    entityEdit.formGroup.controls['server'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: string) => {
      this.serverAddress = res;
    });
  }

  beforeSubmit(data: any): void {
    const serverInfo = data.server.split('/');
    data.server = serverInfo[0];
    data.netmask = parseInt(serverInfo[1]);
  }
}
