import { Component } from '@angular/core';
import { ServicesService } from '../../../services';
import * as _ from 'lodash';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';

import helptext from 'app/helptext/services/components/service-openvpn';


@Component({
  selector: 'openvpn-client',
  template: `<entity-form [conf]="this"></entity-form>`,
})

export class OpenvpnClientComponent {
  protected queryCall = 'openvpn.client.config';
  public title = helptext.client.formTitle;

  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [
    {
      name: 'client-settings',
      label: false,
      config: [
        {
          type : 'select',
          name : 'client_certificate',
          placeholder : helptext.certificate.client_placeholder,
          tooltip: helptext.certificate.tooltip,
          options: [],
        },
        {
          type : 'select',
          name : 'root_ca',
          placeholder : helptext.root_ca.placeholder,
          tooltip: helptext.root_ca.tooltip,
          options: [],
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
        },
        {
          type : 'select',
          name : 'protocol',
          placeholder : helptext.protocol.placeholder,
          tooltip: helptext.protocol.tooltip,
          options: helptext.protocol.enum
        }
      ]
    },
    {
      name: 'client-server-settings',
      label: false,
      config: [
        {
          type : 'select',
          name : 'device_type',
          placeholder : helptext.device_type.placeholder,
          tooltip: helptext.device_type.tooltip,
          options: helptext.device_type.enum
        },
        {
          type : 'checkbox',
          name : 'nobind',
          placeholder : helptext.client.nobind.placeholder,
          tooltip: helptext.client.nobind.tooltip,
        },
        {
          type : 'checkbox',
          name : 'tls_crypt_auth_enabled',
          placeholder : helptext.tls_crypt_auth_enabled.placeholder,
          tooltip: helptext.tls_crypt_auth_enabled.tooltip,
        },
        {
          type : 'textarea',
          name : 'additional_parameters',
          placeholder : helptext.additional_parameters.placeholder,
          tooltip: helptext.additional_parameters.tooltip,
          textAreaRows: 8
        },
        {
          type : 'textarea',
          name : 'tls_crypt_auth',
          placeholder : helptext.client.tls_crypt_auth.placeholder,
          tooltip: helptext.client.tls_crypt_auth.tooltip,
          textAreaRows: 8
        }
      ]
    }
  ];

  constructor(protected services: ServicesService) { }

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
    const cert = _.find(entityEdit.fieldConfig, { name: 'client_certificate' });
    const ca = _.find(entityEdit.fieldConfig, { name: 'root_ca' });

    entityEdit.formGroup.controls['client_certificate'].valueChanges.subscribe(() => {
      cert['hasErrors'] = false;
      ca['hasErrors'] = false;
    })

    entityEdit.formGroup.controls['root_ca'].valueChanges.subscribe(() => {
      cert['hasErrors'] = false;
      ca['hasErrors'] = false;      
      entityEdit.formGroup.controls['client_certificate'].updateValueAndValidity();      
    })
  }
}
