import { Component } from '@angular/core';
import { ServicesService } from '../../../../../services';

import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';

import helptext from 'app/helptext/services/components/service-openvpn';


@Component({
  selector: 'openvpn-server-edit',
  template: ` <entity-form [conf]="this"></entity-form>`,
})

export class ServiceOpenvpnServerComponent {
  protected queryCall = 'openvpn.server.config';
  protected editCall = 'openvpn.server.update';
  public saveSubmitText = helptext.server.saveButtonText;

  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [
    {
      name: helptext.server.header,
      label: true,
      config: [
        {
          type : 'select',
          name : 'server_certificate',
          placeholder : helptext.server.server_certificate.placeholder,
          tooltip: helptext.server.server_certificate.tooltip,
          options: [{label: '---', value: null}]
        },
        {
          type : 'select',
          name : 'root_ca',
          placeholder : helptext.server.root_ca.placeholder,
          tooltip: helptext.server.root_ca.tooltip,
          options: [{label: '---', value: null}]
        },
        {
          type : 'input',
          name : 'port',
          inputType: 'number',
          placeholder : helptext.server.port.placeholder,
          tooltip: helptext.server.port.tooltip,
        },
        {
          type : 'input',
          name : 'additional_parameters',
          placeholder : helptext.server.additional_parameters.placeholder,
          tooltip: helptext.server.additional_parameters.tooltip,
        },
        {
          type : 'select',
          name : 'authentication_algorithm',
          placeholder : helptext.server.authentication_algorithm.placeholder,
          tooltip: helptext.server.authentication_algorithm.tooltip,
          options: [{label: '---', value: null}]
        },
        {
          type : 'select',
          name : 'cipher',
          placeholder : helptext.server.cipher.placeholder,
          tooltip: helptext.server.cipher.tooltip,
          options: [{label: '---', value: null}]
        },
        {
          type : 'select',
          name : 'compression',
          placeholder : helptext.server.compression.placeholder,
          tooltip: helptext.server.compression.tooltip,
          options: helptext.server.compression.enum
        },
        {
          type : 'select',
          name : 'device_type',
          placeholder : helptext.server.device_type.placeholder,
          tooltip: helptext.server.device_type.tooltip,
          options: helptext.server.device_type.enum
        },
        {
          type : 'select',
          name : 'protocol',
          placeholder : helptext.server.protocol.placeholder,
          tooltip: helptext.server.protocol.tooltip,
          options: helptext.server.protocol.enum
        },
        {
          type : 'checkbox',
          name : 'tls_crypt_auth_enabled',
          placeholder : helptext.server.tls_crypt_auth_enabled.placeholder,
          tooltip: helptext.server.tls_crypt_auth_enabled.tooltip,
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
        },
        {
          type : 'select',
          name : 'topology',
          placeholder : helptext.server.topology.placeholder,
          tooltip: helptext.server.topology.tooltip,
          options: helptext.server.topology.enum
        },

      ]
    }
  ]

  constructor(protected services: ServicesService) { }

  resourceTransformIncomingRestData(data) {
    return data;
  }

  afterInit(entityEdit: any) {
    this.services.getOpenVPNServerAuthAlgorithmChoices().subscribe((res) => {
      const config = this.fieldConfig.find(c => c.name === 'authentication_algorithm');
      for (let item in res) {
        config.options.push(
          {label : item, value : res[item]});
      };
    });
    this.services.getOpenServerCipherChoices().subscribe((res) => {
      const config = this.fieldConfig.find(c => c.name === 'cipher');
      for (let item in res) {
        config.options.push(
          {label : item, value : res[item]});
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
  }

}
