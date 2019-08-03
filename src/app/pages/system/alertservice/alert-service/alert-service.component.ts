import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import * as _ from 'lodash';
import { WebSocketService, AppLoaderService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { MatSnackBar } from '@angular/material';
import { EntityUtils } from '../../../common/entity/utils';
import { T } from '../../../../translate-marker';

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
      placeholder: 'Name',
      tooltip: 'Enter a name for the new alert service.',
      required: true,
      validation: [Validators.required],
    },
    {
      type: 'checkbox',
      name: 'enabled',
      placeholder: 'Enabled',
      tooltip: 'Unset to disable this service without deleting it.',
      value: true,
    },
    {
      type: 'select',
      name: 'type',
      placeholder: 'Type',
      tooltip: 'Choose an alert service to display options for that\
                service.',
      options: [{
        label: 'AWS SNS',
        value: 'AWSSNS',
      }, {
        label: 'E-Mail',
        value: 'Mail',
      }, {
        label: 'HipChat',
        value: 'HipChat',
      }, {
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
      placeholder: 'Level',
      tooltip: 'Select the level of severity.',
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
      placeholder: 'AWS Region',
      togglePw: true,
      tooltip: 'Enter the <a\
                href="https://docs.aws.amazon.com/sns/latest/dg/sms_supported-countries.html"\
                target="_blank">AWS account region</a>.',
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
      placeholder: 'ARN',
      tooltip: 'Enter the topic <a\
                href="https://docs.aws.amazon.com/sns/latest/dg/CreateTopic.html"\
                target="_blank">Amazon Resource Name (ARN)</a> for\
                publishing. Example:\
                <b>arn:aws:sns:us-west-2:111122223333:MyTopic</b>.',
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
      placeholder: 'Key ID',
      tooltip: 'Enter the Access Key ID for the linked AWS account.',
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
      placeholder: 'Secret Key',
      inputType: 'password',
      togglePw: true,
      tooltip: 'Enter the Secret Access Key for the linked AWS account.',
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
      placeholder: 'Email Address',
      tooltip: 'Enter a valid email address to receive alerts from this\
                system.',
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'Mail',
        }]
      }]
    },
    // HtpChat
    {
      type: 'input',
      name: 'HipChat-hfrom',
      placeholder: 'From',
      tooltip: 'Enter a name to send alerts',
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'HipChat',
        }]
      }],
      required: true,
      validation: [Validators.required],
    }, {
      type: 'input',
      name: 'HipChat-cluster_name',
      placeholder: 'Cluster Name',
      tooltip: 'Enter the HipChat cluster name.',
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'HipChat',
        }]
      }]
    }, {
      type: 'input',
      name: 'HipChat-base_url',
      placeholder: 'URL',
      tooltip: 'Enter the HipChat base URL.',
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'HipChat',
        }]
      }]
    }, {
      type: 'input',
      name: 'HipChat-room_id',
      placeholder: 'Room',
      tooltip: 'Enter the name of the room.',
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'HipChat',
        }]
      }],
      required: true,
      validation: [Validators.required],
    }, {
      type: 'input',
      name: 'HipChat-auth_token',
      placeholder: 'Auth Token',
      tooltip: 'Enter or paste an Authentication token.',
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'HipChat',
        }]
      }],
      required: true,
      validation: [Validators.required],
    },
    // InfluxDB
    {
      type: 'input',
      name: 'InfluxDB-host',
      placeholder: 'Host',
      tooltip: 'Enter the <a\
                href="https://docs.influxdata.com/influxdb/v1.5/introduction/getting-started/"\
                target="_blank">InfluxDB</a> hostname.',
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
      placeholder: 'Username',
      tooltip: 'Enter the username for this service.',
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
      placeholder: 'Password',
      inputType: 'password',
      togglePw: true,
      tooltip: 'Enter password.',
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
      placeholder: 'Database',
      tooltip: 'Enter the name of the InfluxDB database.',
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
      placeholder: 'Series',
      tooltip: 'Enter InfluxDB time series name for collected points.',
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
      name: 'Mattermost-cluster_name',
      placeholder: 'Cluster Name',
      tooltip: 'Enter the name of the <a\
                href="https://docs.mattermost.com/overview/index.html"\
                target="_blank">Mattermost</a> cluster to join.',
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'Mattermost',
        }]
      }]
    }, {
      type: 'input',
      name: 'Mattermost-url',
      placeholder: 'Webhook URL',
      tooltip: 'Enter or paste the <a\
               href="https://docs.mattermost.com/developer/webhooks-incoming.html"\
               target="_blank">incoming webhook</a> URL associated with\
               this service.',
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
      placeholder: 'Username',
      tooltip: 'Enter the Mattermost username.',
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
      inputType: 'password',
      name: 'Mattermost-password',
      placeholder: 'Password',
      togglePw: true,
      tooltip: 'Enter the Mattermost password.',
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'Mattermost',
        }]
      }]
    }, {
      type: 'input',
      name: 'Mattermost-team',
      placeholder: 'Team',
      tooltip: 'Enter the Mattermost <a\
                href="https://docs.mattermost.com/help/getting-started/creating-teams.html"\
                target="_blank">team name</a>.',
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'Mattermost',
        }]
      }]
    }, {
      type: 'input',
      name: 'Mattermost-channel',
      placeholder: 'Channel',
      tooltip: 'Enter the name of the <a\
                href="https://docs.mattermost.com/help/getting-started/organizing-conversations.html#managing-channels"\
                target="_blank">channel</a> to receive notifications.\
                This overrides the default channel in the incoming\
                webhook settings.',
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'Mattermost',
        }]
      }],
      required: true,
      validation: [Validators.required],
    },
    // OpsGenie
    {
      type: 'input',
      name: 'OpsGenie-cluster_name',
      placeholder: 'Cluster Name',
      tooltip: 'Enter the name of the <a\
                href="https://docs.opsgenie.com/docs"\
                target="_blank">OpsGenie</a> cluster. Find the Cluster\
                Name by signing into the OpsGenie web interface and\
                going to Integrations/Configured Integrations. Click the\
                desired integration, Settings, and read the Name field.',
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'OpsGenie',
        }]
      }]
    }, {
      type: 'input',
      name: 'OpsGenie-api_key',
      placeholder: 'API Key',
      tooltip: 'Enter or paste the <a\
                href="https://docs.opsgenie.com/v1.0/docs/api-integration"\
                target="_blank">API key</a>. Find the API key by signing\
                into the OpsGenie web interface and going to\
                Integrations/Configured Integrations. Click the desired\
                integration, Settings, and read the API Key field.',
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
      placeholder: 'API URL',
      tooltip: 'Leave empty for default (<a href="https://api.opsgenie.com" target="_blank">OpsGenie API</a>)',
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
      placeholder: 'Service Key',
      tooltip: 'Enter or paste the "integration/service" key for this\
                system to access the <a\
                href="https://v2.developer.pagerduty.com/v2/docs/events-api"\
                target="_blank">PagerDuty API</a>.',
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
      placeholder: 'Client Name',
      tooltip: 'Enter the PagerDuty client name.',
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
      name: 'Slack-cluster_name',
      placeholder: 'Cluster Name',
      tooltip: 'Enter the name of the cluster.',
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'Slack',
        }]
      }]
    }, {
      type: 'input',
      name: 'Slack-url',
      placeholder: 'Webhook URL',
      tooltip: 'Paste the <a\
                href="https://api.slack.com/incoming-webhooks"\
                target="_blank">incoming webhook</a> URL associated with\
                this service.',
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'Slack',
        }]
      }],
      required: true,
      validation: [Validators.required],
    }, {
      type: 'input',
      name: 'Slack-channel',
      placeholder: 'Channel',
      tooltip: 'Enter a Slack channel name. The service will post all\
                messages to this channel.',
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'Slack',
        }]
      }]
    }, {
      type: 'input',
      name: 'Slack-username',
      placeholder: 'Username',
      tooltip: 'Enter a Slack username for this service.',
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'Slack',
        }]
      }]
    }, {
      type: 'input',
      name: 'Slack-icon_url',
      placeholder: 'Icon URL',
      tooltip: 'Enter a URL to an image to use for notification icons.\
                This overrides the incoming webhook setting.',
      relation: [{
        action: "SHOW",
        when: [{
          name: "type",
          value: 'Slack',
        }]
      }]
    },
    // SNMPTrap
    {
      type: 'input',
      name: 'SNMPTrap-host',
      placeholder: 'Hostname',
      tooltip: '',
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
      placeholder: 'Port',
      tooltip: '',
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
      placeholder: 'SNMPv3 Security Model',
      tooltip: '',
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
      placeholder: 'Username',
      tooltip: '',
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
      placeholder: 'Secret authentication key',
      tooltip: '',
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
      placeholder: 'Secret encryption key',
      tooltip: '',
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
      placeholder: 'Authentication protocol',
      tooltip: '',
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
      placeholder: 'Encryption protocol',
      tooltip: '',
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
      placeholder: 'SNMP Community',
      tooltip: '',
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
      placeholder: 'API Key',
      tooltip: 'Enter or paste the <a\
                href="https://help.victorops.com/knowledge-base/api/"\
                target="_blank">VictorOps API key</a>.',
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
      placeholder: 'Routing Key',
      tooltip: 'Enter or paste the <a\
                href="https://portal.victorops.com/public/api-docs.html#/Routing32Keys"\
                target="_blank">VictorOps routing key</a>.',
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
              this.snackBar.open('Test alert sent!', 'close', { duration: 5000 });
            } else {
              this.snackBar.open('Failed sending test alert!', 'close', { duration: 5000 });
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
    protected snackBar: MatSnackBar) { }

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
