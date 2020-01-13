import { Component } from '@angular/core';
import { ServicesService } from '../../../../../services';

import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';

import helptext from 'app/helptext/services/components/service-openvpn';


@Component({
  selector: 'openvpn-client-edit',
  template: ` <entity-form [conf]="this"></entity-form>`,
})

export class ServiceOpenvpnClientComponent {
  protected queryCall = 'openvpn.client.config';
  protected editCall = 'openvpn.client.update';
  public saveSubmitText = helptext.client.saveButtonText;

  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [
    {
      name: helptext.client.header,
      label: true,
      config: [
        {
          type : 'select',
          name : 'client_certificate',
          placeholder : helptext.client.client_certificate.placeholder,
          tooltip: helptext.client.client_certificate.tooltip,
          options: [{label: '---', value: null}]
        },
        {
          type : 'select',
          name : 'root_ca',
          placeholder : helptext.client.root_ca.placeholder,
          tooltip: helptext.client.root_ca.tooltip,
          options: [{label: '---', value: null}]
        },
        {
          type : 'input',
          name : 'port',
          inputType: 'number',
          placeholder : helptext.client.port.placeholder,
          tooltip: helptext.client.port.tooltip,
        },
        {
          type : 'input',
          name : 'additional_parameters',
          placeholder : helptext.client.additional_parameters.placeholder,
          tooltip: helptext.client.additional_parameters.tooltip,
        },
        {
          type : 'select',
          name : 'authentication_algorithm',
          placeholder : helptext.client.authentication_algorithm.placeholder,
          tooltip: helptext.client.authentication_algorithm.tooltip,
          options: [{label: '---', value: null}]
        },
        {
          type : 'select',
          name : 'cipher',
          placeholder : helptext.client.cipher.placeholder,
          tooltip: helptext.client.cipher.tooltip,
          options: [{label: '---', value: null}]
        },
        {
          type : 'select',
          name : 'compression',
          placeholder : helptext.client.compression.placeholder,
          tooltip: helptext.client.compression.tooltip,
          options: helptext.client.compression.enum
        },
        {
          type : 'select',
          name : 'device_type',
          placeholder : helptext.client.device_type.placeholder,
          tooltip: helptext.client.device_type.tooltip,
          options: helptext.client.device_type.enum
        },
        {
          type : 'select',
          name : 'protocol',
          placeholder : helptext.client.protocol.placeholder,
          tooltip: helptext.client.protocol.tooltip,
          options: helptext.client.protocol.enum
        },

        {
          type : 'checkbox',
          name : 'tls_crypt_auth_enabled',
          placeholder : helptext.client.tls_crypt_auth_enabled.placeholder,
          tooltip: helptext.client.tls_crypt_auth_enabled.tooltip,
        },
        {
          type : 'select',
          name : 'tls_crypt_auth',
          placeholder : helptext.client.tls_crypt_auth.placeholder,
          tooltip: helptext.client.tls_crypt_auth.tooltip,
          options: [{label: '---', value: null}]
        },
      
        {
          type : 'input',
          name : 'remote',
          placeholder : helptext.client.remote.placeholder,
          tooltip: helptext.client.remote.tooltip,
        },
        {
          type : 'checkbox',
          name : 'nobind',
          placeholder : helptext.client.nobind.placeholder,
          tooltip: helptext.client.nobind.tooltip,
        },

        
      ]
    }
  ];

  constructor(protected services: ServicesService) { }

  resourceTransformIncomingRestData(data) {
    return data;
  }

  afterInit(entityEdit: any) {
    this.services.getOpenVPNClientAuthAlgorithmChoices().subscribe((res) => {
      const config = this.fieldConfig.find(c => c.name === 'authentication_algorithm');
      for (let item in res) {
        config.options.push(
          {label : item, value : res[item]});
      };
    });
    this.services.getOpenVPNClientCipherChoices().subscribe((res) => {
      const config = this.fieldConfig.find(c => c.name === 'cipher');
      for (let item in res) {
        config.options.push(
          {label : item, value : res[item]});
      };
    });
    this.services.getCerts().subscribe((res) => {
      const config = this.fieldConfig.find(c => c.name === 'client_certificate');
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
