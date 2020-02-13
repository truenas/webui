import { Component } from '@angular/core';
import { Http } from '@angular/http';
import { ServicesService, DialogService, AppLoaderService, WebSocketService, StorageService } from 'app/services';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';

import helptext from 'app/helptext/services/components/service-openvpn';

@Component({
  selector: 'openvpn-server-edit',
  template: ` <entity-form [conf]="this"></entity-form>`,
})

export class ServiceOpenvpnServerComponent {
  protected queryCall = 'openvpn.server.config';
  protected route_success: string[] = [ 'services' ];
  protected certID: number;
  protected serverAddress: string;
  protected entityEdit: any;
  public dialogConf: DialogFormConfiguration;
  protected certOptions: any;
  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [
    {
      name: helptext.server.header,
      label: true,
      config: []
    },
    {
      name: 'server-settings',
      label: false,
      width: '53%',
      config: [
        {
          type : 'select',
          name : 'server_certificate',
          placeholder : helptext.certificate.server_placeholder,
          tooltip: helptext.certificate.tooltip,
          options: [],
          required: true
        },
        {
          type : 'select',
          name : 'root_ca',
          placeholder : helptext.root_ca.placeholder,
          tooltip: helptext.root_ca.tooltip,
          options: [],
          required: true
        },
        {
          type : 'ipwithnetmask',
          name : 'server',
          placeholder : helptext.server.server.placeholder,
          tooltip: helptext.server.server.tooltip,
          required: true
        },
        {
          type : 'input',
          name : 'port',
          inputType: 'number',
          placeholder : helptext.port.placeholder,
          tooltip: helptext.port.tooltip,
        },
        {
          type : 'select',
          name : 'authentication_algorithm',
          placeholder : helptext.authentication_algorithm.placeholder,
          tooltip: helptext.authentication_algorithm.tooltip,
          options: [{label: '---', value: null}]
        },
        {
          type : 'select',
          name : 'cipher',
          placeholder : helptext.cipher.placeholder,
          tooltip: helptext.cipher.tooltip,
          options: [{label: '---', value: null}]
        },
        {
          type : 'select',
          name : 'compression',
          placeholder : helptext.compression.placeholder,
          tooltip: helptext.compression.tooltip,
          options: helptext.compression.enum
        }
      ]
    },
    {
      name: 'vertical-spacer',
      label: false,
      width: '4%',
      config: []
    },
    {
      name: 'client-server-settings',
      label: false,
      width: '43%',
      config: [

        {
          type : 'select',
          name : 'protocol',
          placeholder : helptext.protocol.placeholder,
          tooltip: helptext.protocol.tooltip,
          options: helptext.protocol.enum
        },
        {
          type : 'select',
          name : 'device_type',
          placeholder : helptext.device_type.placeholder,
          tooltip: helptext.device_type.tooltip,
          options: helptext.device_type.enum
        },
        {
          type : 'select',
          name : 'topology',
          placeholder : helptext.server.topology.placeholder,
          tooltip: helptext.server.topology.tooltip,
          options: helptext.server.topology.enum,
          relation : [
            {
              action : 'DISABLE',
              when : [ {
                name : 'device_type',
                value : 'TAP',
              } ]
            },
          ]
        },
        {
          type : 'input',
          name : 'additional_parameters',
          placeholder : helptext.additional_parameters.placeholder,
          tooltip: helptext.additional_parameters.tooltip,
        },
        {
          type : 'checkbox',
          name : 'tls_crypt_auth_enabled',
          placeholder : helptext.tls_crypt_auth_enabled.placeholder,
          tooltip: helptext.tls_crypt_auth_enabled.tooltip,
        },
        {
          type : 'textarea',
          name : 'tls_crypt_auth',
          placeholder : helptext.server.tls_crypt_auth.placeholder,
          tooltip: helptext.server.tls_crypt_auth.tooltip,
          textAreaRows: 8
        }
      ]
    }
  ]

  public custActions: Array<any> = [
    {
      id : 'renew_key',
      name : helptext.server.buttons.renew,
      function : () => {
        this.loader.open();
        this.services.renewStaticKey().subscribe((res) => {
          let msg = '';
          for (let item in res) {
            msg += `${item}: ${res[item]} \n`
          }
          this.loader.close();
          this.entityEdit.formGroup.controls['tls_crypt_auth'].setValue(res.tls_crypt_auth);
          const filename = 'openVPNStatic.key';
          const blob = new Blob([msg], {type: 'text/plain'});
          this.storageService.downloadBlob(blob, filename);

        }, err => {
          this.loader.close();
          this.dialog.errorReport(helptext.error_dialog_title, err.reason, err.trace.formatted)
        })
      }
    },
    {
      id : 'client_config',
      name : helptext.server.buttons.download,
      function : () => {
        const self = this;
        const conf: DialogFormConfiguration = {
          title: 'Select Client Certificate',
          fieldConfig: [
            {
              type: 'select',
              name: 'client_certificate_id',
              placeholder: 'Client Certificate',
              tooltip: 'This is very important.',
              options: this.certOptions
            }
          ],
          saveButtonText: ('Submit'),
          customSubmit: function (entityDialog) {
            const value = entityDialog.formValue;
            entityDialog.dialogRef.close(true);
            self.loader.open();
            self.services.generateOpenServerClientConfig(value.client_certificate_id, 
              self.serverAddress).subscribe((key) => {
              const filename = 'openVPNClientConfig.ovpn';
              const blob = new Blob([key], {type: 'text/plain'});
              self.storageService.downloadBlob(blob, filename);
              self.loader.close();
            }, err => {
              self.loader.close();
              self.dialog.errorReport(helptext.error_dialog_title, err.reason, err.trace.formatted)
            })
          }
        }
        this.dialog.dialogForm(conf);
      }
    }
  ];

  constructor(protected services: ServicesService, protected dialog: DialogService,
    protected loader: AppLoaderService, protected ws: WebSocketService, protected storageService: StorageService,
    protected http: Http) { }

  resourceTransformIncomingRestData(data) {
    data.server = `${data.server}/${data.netmask}`;
    return data;
  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
    entityEdit.submitFunction = body => this.services.updateOpenVPN('openvpn.server.update', body); 

    this.services.getClientInfo().subscribe((res) => {
      this.certID = res.client_certificate;
    })

    this.services.getOpenVPNServerAuthAlgorithmChoices().subscribe((res) => {
      const config = this.fieldConfig.find(c => c.name === 'authentication_algorithm');
      for (let item in res) {
        config.options.push(
          {label : `${item} (${res[item]})`, value : item});
      };
    });
    this.services.getOpenServerCipherChoices().subscribe((res) => {
      const config = this.fieldConfig.find(c => c.name === 'cipher');
      for (let item in res) {
        config.options.push(
          {label : `${item} ${res[item]}`, value : item});
      };
    });
    this.services.getCerts().subscribe((res) => {
      const config = this.fieldConfig.find(c => c.name === 'server_certificate');
      res.forEach((item) => {
        config.options.push({label: item.name, value: item.id})
      })
      this.certOptions = config.options;
    });
    this.services.getCAs().subscribe((res) => {
      const config = this.fieldConfig.find(c => c.name === 'root_ca');
      res.forEach((item) => {
        config.options.push({label: item.name, value: item.id})
      })
    });
    entityEdit.formGroup.controls['server'].valueChanges.subscribe((res) => {
      this.serverAddress = res;
    })
  }

  beforeSubmit(data) {
    const serverInfo = data.server.split('/');
    data.server = serverInfo[0];
    data.netmask = parseInt(serverInfo[1]);
  }
}
