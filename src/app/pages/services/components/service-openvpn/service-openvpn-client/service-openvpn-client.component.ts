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
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [
    {
      name: helptext.client.header,
      label: true,
      config: []
    },
    {
      name: 'client-settings',
      label: false,
      width: '53%',
      config: [
        {
          type : 'select',
          name : 'client_certificate',
          placeholder : helptext.client.client_certificate.placeholder,
          tooltip: helptext.client.client_certificate.tooltip,
          options: [],
          required: true
        },
        {
          type : 'select',
          name : 'root_ca',
          placeholder : helptext.client.root_ca.placeholder,
          tooltip: helptext.client.root_ca.tooltip,
          options: [],
          required: true,
        },
        {
          type : 'input',
          name : 'remote',
          placeholder : helptext.client.remote.placeholder,
          tooltip: helptext.client.remote.tooltip,
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
          type : 'input',
          name : 'tls_crypt_auth',
          placeholder : helptext.client.tls_crypt_auth.placeholder,
          tooltip: helptext.client.tls_crypt_auth.tooltip,
          options: [{label: '---', value: null}]
        },
        {
          type : 'checkbox',
          name : 'nobind',
          placeholder : helptext.client.nobind.placeholder,
          tooltip: helptext.client.nobind.tooltip,
        },
        {
          type : 'input',
          name : 'additional_parameters',
          placeholder : helptext.additional_parameters.placeholder,
          tooltip: helptext.additional_parameters.tooltip,
        },
      ]
    },
  ];

  constructor(protected services: ServicesService) { }

  resourceTransformIncomingRestData(data) {
    return data;
  }

  afterInit(entityEdit: any) {
    entityEdit.submitFunction = body => this.services.updateOpenVPN('openvpn.client.update', body); 

    this.services.getOpenVPNClientAuthAlgorithmChoices().subscribe((res) => {
      const config = this.fieldConfig.find(c => c.name === 'authentication_algorithm');
      for (let item in res) {
        config.options.push(
          {label : `${item} (${res[item]})`, value : item});
      };
    });
    this.services.getOpenVPNClientCipherChoices().subscribe((res) => {
      const config = this.fieldConfig.find(c => c.name === 'cipher');
      for (let item in res) {
        config.options.push(
          {label : `${item} ${res[item]}`, value : item});
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

  beforeSubmit(data) {
    console.log(data)
  }


}
