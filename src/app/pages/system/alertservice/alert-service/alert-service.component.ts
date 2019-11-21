import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import * as _ from 'lodash';
import { WebSocketService, AppLoaderService, DialogService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { EntityUtils } from '../../../common/entity/utils';
import { T } from '../../../../translate-marker';
import helptext from '../../../../helptext/system/alert-service';

@Component({
  selector: 'app-alertservice',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [EntityFormService]
})
export class AlertServiceComponent {

  protected addCall = 'alertservice.create';
  protected queryCall = 'alertservice.query';
  protected queryCallOption: Array<any> = [['id', '=']];
  protected editCall = 'alertservice.update';
  protected testCall = 'alertservice.test';
  public route_success: string[] = ['system', 'alertservice'];

  protected isEntity = true;
  public entityForm: any;

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'name',
      placeholder: helptext.name_placeholder,
      tooltip: helptext.name_tooltip,
      required: true,
      validation: [Validators.required],
    },
    {
      type: 'checkbox',
      name: 'enabled',
      placeholder: helptext.enabled_placeholder,
      tooltip: helptext.enabled_tooltip,
      value: true,
    },
    {
      type: 'select',
      name: 'type',
      placeholder: helptext.type_placeholder,
      tooltip: helptext.type_tooltip,
      options: [{
        label: 'AWS SNS',
        value: 'AWSSNS',
      }, {
        label: 'E-Mail',
        value: 'Mail',
      },{
        label: 'InfluxDB',
        value: 'InfluxDB',
      }, {
        label: 'Mattermost',
        value: 'Mattermost',
      }, {
        label: 'OpsGenie',
        value: 'OpsGenie',
      }, {
        label: 'PagerDuty',
        value: 'PagerDuty',
      }, {
        label: 'Slack',
        value: 'Slack',
      }, {
        label: 'SNMP Trap',
        value: 'SNMPTrap',
      }, {
        label: 'VictorOps',
        value: 'VictorOps',
      }],
      value: 'AWSSNS',
    },
    {
      type: 'select',
      name: 'level',
      placeholder: helptext.level_placeholder,
      tooltip: helptext.level_tooltip,
      options: [
        { label: 'Info', value: 'INFO' },
        { label: 'Notice', value: 'NOTICE' },
        { label: 'Warning', value: 'WARNING' },
        { label: 'Error', value: 'ERROR' },
        { label: 'Critical', value: 'CRITICAL' },
        { label: 'Alert', value: 'ALERT' },
        { label: 'Emergency', value: 'EMERGENCY' }
      ],
      value: 'WARNING',
    },
    // AWSSNS
    {
      type: 'input',
      name: 'AWSSNS-region',
      placeholder: helptext.AWSSNS_region_placeholder,
      togglePw: true,
      tooltip: helptext.AWSSNS_region_tooltip,
      required: true,
      validation: [Validators.required],
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'AWSSNS',
        }]
      }]
    }, {
      type: 'input',
      name: 'AWSSNS-topic_arn',
      placeholder: helptext.AWSSNS_topic_arn_placeholder,
      tooltip: helptext.AWSSNS_topic_arn_tooltip,
      required: true,
      validation: [Validators.required],
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'AWSSNS',
        }]
      }]
    }, {
      type: 'input',
      name: 'AWSSNS-aws_access_key_id',
      placeholder: helptext.AWSSNS_aws_access_key_id_placeholder,
      tooltip: helptext.AWSSNS_aws_access_key_id_tooltip,
      required: true,
      validation: [Validators.required],
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'AWSSNS',
        }]
      }]
    }, {
      type: 'input',
      name: 'AWSSNS-aws_secret_access_key',
      placeholder: helptext.AWSSNS_aws_secret_access_key_placeholder,
      inputType: 'password',
      togglePw: true,
      tooltip: helptext.AWSSNS_aws_secret_access_key_tooltip,
      required: true,
      validation: [Validators.required],
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'AWSSNS',
        }]
      }]
    },
    // Mail
    {
      type: 'input',
      inputType: 'email',
      name: 'Mail-email',
      placeholder: helptext.Mail_email_placeholder,
      tooltip: helptext.Mail_email_tooltip,
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'Mail',
        }]
      }]
    },
    // InfluxDB
    {
      type: 'input',
      name: 'InfluxDB-host',
      placeholder: helptext.InfluxDB_host_placeholder,
      tooltip: helptext.InfluxDB_host_tooltip,
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'InfluxDB',
        }]
      }],
      required: true,
      validation: [Validators.required],
    }, {
      type: 'input',
      name: 'InfluxDB-username',
      placeholder: helptext.InfluxDB_username_placeholder,
      tooltip: helptext.InfluxDB_username_tooltip,
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'InfluxDB',
        }]
      }],
      required: true,
      validation: [Validators.required],
    }, {
      type: 'input',
      name: 'InfluxDB-password',
      placeholder: helptext.InfluxDB_password_placeholder,
      inputType: 'password',
      togglePw: true,
      tooltip: helptext.InfluxDB_password_tooltip,
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'InfluxDB',
        }]
      }],
      required: true,
      validation: [Validators.required],
    }, {
      type: 'input',
      name: 'InfluxDB-database',
      placeholder: helptext.InfluxDB_database_placeholder,
      tooltip: helptext.InfluxDB_database_tooltip,
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'InfluxDB',
        }]
      }],
      required: true,
      validation: [Validators.required],
    }, {
      type: 'input',
      name: 'InfluxDB-series_name',
      placeholder: helptext.InfluxDB_series_name_placeholder,
      tooltip: helptext.InfluxDB_series_name_tooltip,
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'InfluxDB',
        }]
      }],
      required: true,
      validation: [Validators.required],
    },
    // Mattermost
    {
      type: 'input',
      name: 'Mattermost-url',
      placeholder: helptext.Mattermost_url_placeholder,
      tooltip: helptext.Mattermost_url_tooltip,
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'Mattermost',
        }]
      }],
      required: true,
      validation: [Validators.required],
    }, {
      type: 'input',
      name: 'Mattermost-username',
      placeholder: helptext.Mattermost_username_placeholder,
      tooltip: helptext.Mattermost_username_tooltip,
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'Mattermost',
        }]
      }],
      required: true,
      validation: [Validators.required],
    }, {
      type: 'input',
      name: 'Mattermost-channel',
      placeholder: helptext.Mattermost_channel_placeholder,
      tooltip: helptext.Mattermost_channel_tooltip,
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'Mattermost',
        }]
      }],
    }, {
      type: 'input',
      name: 'Mattermost-icon_url',
      placeholder: helptext.Mattermost_icon_url_placeholder,
      tooltip: helptext.Mattermost_icon_url_tooltip,
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'Mattermost',
        }]
      }],
    },
    // OpsGenie
    {
      type: 'input',
      name: 'OpsGenie-api_key',
      placeholder: helptext.OpsGenie_api_key_placeholder,
      tooltip: helptext.OpsGenie_api_key_tooltip,
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'OpsGenie',
        }]
      }],
      required: true,
      validation: [Validators.required],
    }, {
      type: 'input',
      name: 'OpsGenie-api_url',
      placeholder: helptext.OpsGenie_api_url_placeholder,
      tooltip: helptext.OpsGenie_api_url_tooltip,
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'OpsGenie',
        }]
      }]
    },
    // PagerDuty
    {
      type: 'input',
      name: 'PagerDuty-service_key',
      placeholder: helptext.PagerDuty_service_key_placeholder,
      tooltip: helptext.PagerDuty_service_key_tooltip,
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'PagerDuty',
        }]
      }],
      required: true,
      validation: [Validators.required],
    }, {
      type: 'input',
      name: 'PagerDuty-client_name',
      placeholder: helptext.PagerDuty_client_name_placeholder,
      tooltip: helptext.PagerDuty_client_name_tooltip,
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'PagerDuty',
        }]
      }],
      required: true,
      validation: [Validators.required],
    },
    // Slack
    {
      type: 'input',
      name: 'Slack-url',
      placeholder: helptext.Slack_url_placeholder,
      tooltip: helptext.Slack_url_tooltip,
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'Slack',
        }]
      }],
      required: true,
      validation: [Validators.required],
    },
    // SNMPTrap
    {
      type: 'input',
      name: 'SNMPTrap-host',
      placeholder: helptext.SNMPTrap_host_placeholder,
      tooltip: helptext.SNMPTrap_host_tooltip,
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'SNMPTrap',
        }]
      }],
      required: true,
      validation: [Validators.required],
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'SNMPTrap-port',
      placeholder: helptext.SNMPTrap_port_placeholder,
      tooltip: helptext.SNMPTrap_port_tooltip,
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'SNMPTrap',
        }]
      }],
      value: 162,
    },
    {
      type: 'checkbox',
      name: 'SNMPTrap-v3',
      placeholder: helptext.SNMPTrap_v3_placeholder,
      tooltip: helptext.SNMPTrap_v3_tooltip,
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'SNMPTrap',
        }]
      }],
      value: false,
    },
    {
      type: 'input',
      name: 'SNMPTrap-v3_username',
      placeholder: helptext.SNMPTrap_v3_username_placeholder,
      tooltip: helptext.SNMPTrap_v3_username_tooltip,
      relation: [{
        action: "SHOW",
        connective: 'AND',
        when: [{
          name: "type",
          value: 'SNMPTrap',
        }, {
          name: "SNMPTrap-v3",
          value: true,
        }]
      }]
    },
    {
      type: 'input',
      name: 'SNMPTrap-v3_authkey',
      placeholder: helptext.SNMPTrap_v3_authkey_placeholder,
      tooltip: helptext.SNMPTrap_v3_authkey_tooltip,
      relation: [{
        action: "SHOW",
        connective: 'AND',
        when: [{
          name: "type",
          value: 'SNMPTrap',
        }, {
          name: "SNMPTrap-v3",
          value: true,
        }]
      }]
    },
    {
      type: 'input',
      name: 'SNMPTrap-v3_privkey',
      placeholder: helptext.SNMPTrap_v3_privkey_placeholder,
      tooltip: helptext.SNMPTrap_v3_privkey_tooltip,
      relation: [{
        action: "SHOW",
        connective: 'AND',
        when: [{
          name: "type",
          value: 'SNMPTrap',
        }, {
          name: "SNMPTrap-v3",
          value: true,
        }]
      }]
    },
    {
      type: 'select',
      name: 'SNMPTrap-v3_authprotocol',
      placeholder: helptext.SNMPTrap_v3_authprotocol_placeholder,
      tooltip: helptext.SNMPTrap_v3_authprotocol_tooltip,
      options: [
        {
          label: 'Disabled',
          value: '',
        },
        {
          label: 'MD5',
          value: 'MD5',
        },
        {
          label: 'SHA',
          value: 'SHA',
        },
        {
          label: 'HMAC128SHA224',
          value: '128SHA224',
        },
        {
          label: 'HMAC192SHA256',
          value: '192SHA256',
        },
        {
          label: 'HMAC256SHA384',
          value: '256SHA384',
        },
        {
          label: 'HMAC384SHA512',
          value: '384SHA512',
        }
      ],
      value: '',
      relation: [{
        action: "SHOW",
        connective: 'AND',
        when: [{
          name: "type",
          value: 'SNMPTrap',
        }, {
          name: "SNMPTrap-v3",
          value: true,
        }]
      }],
    },
    {
      type: 'select',
      name: 'SNMPTrap-v3_privprotocol',
      placeholder: helptext.SNMPTrap_v3_privprotocol_placeholder,
      tooltip: helptext.SNMPTrap_v3_privprotocol_tooltip,
      options: [
        {
          label: 'Disabled',
          value: '',
        },
        {
          label: 'DES',
          value: 'DES',
        },
        {
          label: '3DES-EDE',
          value: '3DESEDE',
        },
        {
          label: 'CFB128-AES-128',
          value: 'AESCFB128',
        },
        {
          label: 'CFB128-AES-192',
          value: 'AESCFB192',
        },
        {
          label: 'CFB128-AES-256',
          value: 'AESCFB256',
        },
        {
          label: 'CFB128-AES-192 Blumenthal',
          value: 'AESBLUMENTHALCFB192',
        },
        {
          label: 'CFB128-AES-256 Blumenthal',
          value: 'AESBLUMENTHALCFB256',
        }
      ],
      value: '',
      relation: [{
        action: "SHOW",
        connective: 'AND',
        when: [{
          name: "type",
          value: 'SNMPTrap',
        }, {
          name: "SNMPTrap-v3",
          value: true,
        }]
      }]
    },
    {
      type: 'input',
      name: 'SNMPTrap-community',
      placeholder: helptext.SNMPTrap_community_placeholder,
      tooltip: helptext.SNMPTrap_community_tooltip,
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'SNMPTrap',
        }]
      }],
      value: 'public',
    },
    // VictorOps
    {
      type: 'input',
      name: 'VictorOps-api_key',
      placeholder: helptext.VictorOps_api_key_placeholder,
      tooltip: helptext.VictorOps_api_key_tooltip,
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'VictorOps',
        }]
      }],
      required: true,
      validation: [Validators.required],
    }, {
      type: 'input',
      name: 'VictorOps-routing_key',
      placeholder: helptext.VictorOps_routing_key_placeholder,
      tooltip: helptext.VictorOps_routing_key_tooltip,
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'VictorOps',
        }]
      }],
      required: true,
      validation: [Validators.required],
    }
  ];

  public custActions: Array<any> = [
    {
      id: 'authenticate',
      name: T('SEND TEST ALERT'),
      function: () => {
        this.entityFormService.clearFormError(this.fieldConfig);
        const testPayload = this.generatePayload(_.cloneDeep(this.entityForm.formGroup.value));

        this.loader.open();
        this.ws.call(this.testCall, [testPayload]).subscribe(
          (res) => {
            this.loader.close();
            if (res) {
              this.dialogService.Info(T('Succeeded'), T('Test alert sent!'), '500px', 'info');
            } else {
              this.dialogService.Info(T('Failed'), T('Failed sending test alert!'));
            }
          },
          (err) => {
            this.loader.close();
            new EntityUtils().handleWSError(this, err, this.entityForm.dialog);
          });
      }
    }
  ];

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected entityFormService: EntityFormService,
    protected loader: AppLoaderService,
    protected dialogService: DialogService) { }

  preInit() {
    this.aroute.params.subscribe(params => {
      if (params['pk']) {
        this.queryCallOption[0].push(Number(params['pk']));
      }
    });
  }

  afterInit(entityForm) {
    this.entityForm = entityForm;
  }

  dataAttributeHandler(entityForm: any) {
    const type = entityForm.formGroup.controls['type'].value;
    for (const i in entityForm.wsResponseIdx) {
      const field_name = type + '-' + i;
      if (entityForm.formGroup.controls[field_name]) {
        if ((i === 'v3_authprotocol' || i === 'v3_privprotocol') && entityForm.wsResponseIdx[i] === null) {
          entityForm.wsResponseIdx[i] = '';
        }
        entityForm.formGroup.controls[field_name].setValue(entityForm.wsResponseIdx[i]);
      }
    }
  }

  generatePayload(data) {
    const payload = { attributes: {} };

    for (const i in data) {
      if (i === 'name' || i === 'type' || i === 'enabled' || i === 'level') {
        payload[i] = data[i];
      } else {
        if (data[i] === '' && (i === 'SNMPTrap-v3_authprotocol' || i === 'SNMPTrap-v3_privprotocol')) {
          data[i] = null;
        }
        payload['attributes'][i.split('-')[1]] = data[i];
      }
    }
    return payload;
  }

  customSubmit(value) {
    this.entityFormService.clearFormError(this.fieldConfig);
    const payload = this.generatePayload(value);

    this.loader.open();
    if (this.entityForm.isNew) {
      this.ws.call(this.addCall, [payload]).subscribe(
        (res) => {
          this.loader.close();
          this.router.navigate(new Array('/').concat(this.route_success));
        },
        (err) => {
          this.loader.close();
          new EntityUtils().handleWSError(this, err, this.entityForm.dialog);
        });
    } else {
      this.ws.call(this.editCall, [this.entityForm.pk, payload]).subscribe(
        (res) => {
          this.loader.close();
          this.router.navigate(new Array('/').concat(this.route_success));
        },
        (err) => {
          this.loader.close();
          new EntityUtils().handleWSError(this, err, this.entityForm.dialog);
        });
    }
  }

  getErrorField(field) {
    return _.find(this.fieldConfig, { 'name': this.entityForm.formGroup.controls['type'].value + '-' + field });
  }
}
