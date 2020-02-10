import { Component } from '@angular/core';
import { ServicesService, DialogService} from '../../../../../services';

import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';

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
          placeholder : helptext.server.server_certificate.placeholder,
          tooltip: helptext.server.server_certificate.tooltip,
          options: [],
          required: true
        },
        {
          type : 'select',
          name : 'root_ca',
          placeholder : helptext.server.root_ca.placeholder,
          tooltip: helptext.server.root_ca.tooltip,
          options: [],
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
          name : 'device_type',
          placeholder : helptext.device_type.placeholder,
          tooltip: helptext.device_type.tooltip,
          options: helptext.device_type.enum
        },
        {
          type : 'select',
          name : 'protocol',
          placeholder : helptext.protocol.placeholder,
          tooltip: helptext.protocol.tooltip,
          options: helptext.protocol.enum
        },
        {
          type : 'checkbox',
          name : 'tls_crypt_auth_enabled',
          placeholder : helptext.tls_crypt_auth_enabled.placeholder,
          tooltip: helptext.tls_crypt_auth_enabled.tooltip,
        },
        {
          type : 'select',
          name : 'tls_crypt_auth',
          placeholder : helptext.server.tls_crypt_auth.placeholder,
          tooltip: helptext.server.tls_crypt_auth.tooltip,
          options: [{label: '---', value: null}]
        },
        {
          type : 'input',
          name : 'netmask',
          inputType: 'number',
          placeholder : helptext.server.netmask.placeholder,
          tooltip: helptext.server.netmask.tooltip,
        },
      
        {
          type : 'input',
          name : 'server',
          placeholder : helptext.server.server.placeholder,
          tooltip: helptext.server.server.tooltip,
          required: true
        },
        {
          type : 'select',
          name : 'topology',
          placeholder : helptext.server.topology.placeholder,
          tooltip: helptext.server.topology.tooltip,
          options: helptext.server.topology.enum
        },
        {
          type : 'input',
          name : 'additional_parameters',
          placeholder : helptext.additional_parameters.placeholder,
          tooltip: helptext.additional_parameters.tooltip,
        }
      ]
    }
  ]

  public custActions: Array<any> = [
    {
      id : 'renew_key',
      name : 'Renew Static Key',
      function : () => {
        this.services.renewStaticKey('whatevs').subscribe((res) => {
          console.log(res);
        }, err => {
          this.dialog.errorReport(helptext.error_dialog_title, err.reason, err.trace.formatted)
        })
      }
    },
    {
      id : 'client_config',
      name : 'Download Client Config',
      function : () => {
        this.services.generateOpenServerClientConfig(this.certID, this.serverAddress).subscribe((res) => {
        }, err => {
          this.dialog.errorReport(helptext.error_dialog_title, err.reason, err.trace.formatted)
        })
      }
    }
  ];

  constructor(protected services: ServicesService, protected dialog: DialogService) { }

  resourceTransformIncomingRestData(data) {
    return data;
  }

  afterInit(entityEdit: any) {
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
    console.log(data)
  }

}
