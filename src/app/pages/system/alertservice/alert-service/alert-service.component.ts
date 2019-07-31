import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FieldRelationService } from '../../../common/entity/entity-form/services/field-relation.service';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { MatSnackBar } from '@angular/material';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector: 'app-alertservice',
  templateUrl: './alert-service.component.html',
  styleUrls: ['../../../common/entity/entity-form/entity-form.component.scss'],
  providers: [EntityFormService, FieldRelationService]
})
export class AlertServiceComponent implements OnInit {

  protected addCall = 'alertservice.create';
  protected queryCall = 'alertservice.query';
  protected editCall = 'alertservice.update';
  protected testCall = 'alertservice.test';
  public route_success: string[] = ['system', 'alertservice'];
  protected isNew = true;
  protected pk: any;
  public selectedType = 'AWSSNS';

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
        value: 'HtpChat',
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
        {label : 'Info', value : 'INFO'},
        {label : 'Notice', value : 'NOTICE'},
        {label : 'Warning', value : 'WARNING'},
        {label : 'Error', value : 'ERROR'},
        {label : 'Critical', value : 'CRITICAL'},
        {label : 'Alert', value : 'ALERT'},
        {label : 'Emergency', value : 'EMERGENCY'}
      ]
    }
  ];

  public awssnsFieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'region',
      placeholder : 'AWS Region',
      togglePw: true,
      tooltip: 'Enter the <a\
                href="https://docs.aws.amazon.com/sns/latest/dg/sms_supported-countries.html"\
                target="_blank">AWS account region</a>.',
    }, {
      type: 'input',
      name: 'topic_arn',
      placeholder: 'ARN',
      tooltip: 'Enter the topic <a\
                href="https://docs.aws.amazon.com/sns/latest/dg/CreateTopic.html"\
                target="_blank">Amazon Resource Name (ARN)</a> for\
                publishing. Example:\
                <b>arn:aws:sns:us-west-2:111122223333:MyTopic</b>.',
    }, {
      type : 'input',
      name : 'aws_access_key_id',
      placeholder : 'Key ID',
      tooltip: 'Enter the Access Key ID for the linked AWS account.',
    }, {
      type: 'input',
      name: 'aws_secret_access_key',
      placeholder: 'Secret Key',
      inputType: 'password',
      togglePw: true,
      tooltip: 'Enter the Secret Access Key for the linked AWS account.',
    },
  ];
  public emailFieldConfig: FieldConfig[] = [{
    type: 'input',
    inputType: 'email',
    name: 'email',
    placeholder: 'Email Address',
    tooltip: 'Enter a valid email address to receive alerts from this\
              system.',
  }];
  public htpchatFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'hfrom',
      placeholder: 'From',
      tooltip: 'Enter a name to send alerts',
    }, {
      type: 'input',
      name: 'cluster_name',
      placeholder: 'Cluster Name',
      tooltip: 'Enter the HipChat cluster name.',
    }, {
      type: 'input',
      name: 'base_url',
      placeholder: 'URL',
      tooltip: 'Enter the HipChat base URL.',
    }, {
      type: 'input',
      name: 'room_id',
      placeholder: 'Room',
      tooltip: 'Enter the name of the room.',
    }, {
      type: 'input',
      name: 'auth_token',
      placeholder: 'Auth Token',
      tooltip: 'Enter or paste an Authentication token.',
    },
  ];
  public influxdbFieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'host',
      placeholder: 'Host',
      tooltip: 'Enter the <a\
                href="https://docs.influxdata.com/influxdb/v1.5/introduction/getting-started/"\
                target="_blank">InfluxDB</a> hostname.',
    }, {
      type : 'input',
      name : 'username',
      placeholder: 'Username',
      tooltip: 'Enter the username for this service.',
    }, {
      type : 'input',
      name : 'password',
      placeholder: 'Password',
      inputType: 'password',
      togglePw: true,
      tooltip: 'Enter password.',
    }, {
      type : 'input',
      name : 'database',
      placeholder: 'Database',
      tooltip: 'Enter the name of the InfluxDB database.',
    }, {
      type : 'input',
      name : 'series_name',
      placeholder: 'Series',
      tooltip: 'Enter InfluxDB time series name for collected points.',
    }
  ];
  public mattermostFieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'cluster_name',
      placeholder: 'Cluster Name',
      tooltip: 'Enter the name of the <a\
                href="https://docs.mattermost.com/overview/index.html"\
                target="_blank">Mattermost</a> cluster to join.',
    }, {
      type : 'input',
      name : 'url',
      placeholder: 'Webhook URL',
      tooltip:'Enter or paste the <a\
               href="https://docs.mattermost.com/developer/webhooks-incoming.html"\
               target="_blank">incoming webhook</a> URL associated with\
               this service.',
    }, {
      type : 'input',
      name : 'username',
      placeholder: 'Username',
      tooltip: 'Enter the Mattermost username.',
    }, {
      type : 'input',
      inputType: 'password',
      name : 'password',
      placeholder: 'Password',
      togglePw: true,
      tooltip: 'Enter the Mattermost password.',
    }, {
      type : 'input',
      name : 'team',
      placeholder: 'Team',
      tooltip: 'Enter the Mattermost <a\
                href="https://docs.mattermost.com/help/getting-started/creating-teams.html"\
                target="_blank">team name</a>.',
    }, {
      type : 'input',
      name : 'channel',
      placeholder: 'Channel',
      tooltip: 'Enter the name of the <a\
                href="https://docs.mattermost.com/help/getting-started/organizing-conversations.html#managing-channels"\
                target="_blank">channel</a> to receive notifications.\
                This overrides the default channel in the incoming\
                webhook settings.',
    }
  ];
  public opsgenieFieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'cluster_name',
      placeholder: 'Cluster Name',
      tooltip: 'Enter the name of the <a\
                href="https://docs.opsgenie.com/docs"\
                target="_blank">OpsGenie</a> cluster. Find the Cluster\
                Name by signing into the OpsGenie web interface and\
                going to Integrations/Configured Integrations. Click the\
                desired integration, Settings, and read the Name field.',
    },{
      type : 'input',
      name : 'api_key',
      placeholder: 'API Key',
      tooltip: 'Enter or paste the <a\
                href="https://docs.opsgenie.com/v1.0/docs/api-integration"\
                target="_blank">API key</a>. Find the API key by signing\
                into the OpsGenie web interface and going to\
                Integrations/Configured Integrations. Click the desired\
                integration, Settings, and read the API Key field.',
    },{
      type : 'input',
      name : 'api_url',
      placeholder: 'API URL',
      tooltip: 'Leave empty for default (<a href="https://api.opsgenie.com" target="_blank">OpsGenie API</a>)',
    }
  ];
  public pagerdutyFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'service_key',
      placeholder: 'Service Key',
      tooltip: 'Enter or paste the "integration/service" key for this\
                system to access the <a\
                href="https://v2.developer.pagerduty.com/v2/docs/events-api"\
                target="_blank">PagerDuty API</a>.',
    }, {
      type: 'input',
      name: 'client_name',
      placeholder: 'Client Name',
      tooltip: 'Enter the PagerDuty client name.',
    }
  ];
  public slackFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'cluster_name',
      placeholder: 'Cluster Name',
      tooltip: 'Enter the name of the cluster.',
    }, {
      type: 'input',
      name: 'url',
      placeholder: 'Webhook URL',
      tooltip: 'Paste the <a\
                href="https://api.slack.com/incoming-webhooks"\
                target="_blank">incoming webhook</a> URL associated with\
                this service.',
    }, {
      type: 'input',
      name: 'channel',
      placeholder: 'Channel',
      tooltip: 'Enter a Slack channel name. The service will post all\
                messages to this channel.',
    }, {
      type: 'input',
      name: 'username',
      placeholder: 'Username',
      tooltip: 'Enter a Slack username for this service.',
    },  {
      type: 'input',
      name: 'icon_url',
      placeholder: 'Icon URL',
      tooltip: 'Enter a URL to an image to use for notification icons.\
                This overrides the incoming webhook setting.',
    }
  ];
  public snmpTrapFieldConfig: FieldConfig[] = [];
  public victoropsFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'api_key',
      placeholder: 'API Key',
      tooltip: 'Enter or paste the <a\
                href="https://help.victorops.com/knowledge-base/api/"\
                target="_blank">VictorOps API key</a>.',
    }, {
      type: 'input',
      name: 'routing_key',
      placeholder: 'Routing Key',
      tooltip: 'Enter or paste the <a\
                href="https://portal.victorops.com/public/api-docs.html#/Routing32Keys"\
                target="_blank">VictorOps routing key</a>.',
    }];

  public formGroup: any;
  public activeFormGroup: any;
  public emailFormGroup: any;
  public snmpTrapFormGroup: any;
  public slackFormGroup: any;
  public awssnsFormGroup: any;
  public influxdbFormGroup: any;
  public mattermostFormGroup: any;
  public opsgenieFormGroup: any;
  public htpchatFormGroup: any;
  public pagerdutyFormGroup: any;
  public victoropsFormGroup: any;

  protected settingOptions: any = [{
    label: 'INHERIT',
    value: 'INHERIT',
  }];

  public fieldSets: any;

  constructor(protected router: Router,
    protected route: ActivatedRoute,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected entityFormService: EntityFormService,
    protected fieldRelationService: FieldRelationService,
    protected loader: AppLoaderService,
    protected snackBar: MatSnackBar, ) {
    this.ws.call('alert.list_policies', []).subscribe((res) => {
      for(let i = 0; i < res.length; i++) {
        this.settingOptions.push({label: res[i], value: res[i]});
      }
    });
  }

  ngOnInit() {
    this.fieldSets = [
      {
        name:'FallBack',
        class:'fallback',
        width:'100%',
        divider:false,
        fieldConfig: this.fieldConfig,
        emailFieldConfig: this.emailFieldConfig,
        snmpTrapFieldConfig: this.snmpTrapFieldConfig,
        slackFieldConfig: this.slackFieldConfig,
        awssnsFieldConfig: this.awssnsFieldConfig,
        influxdbFieldConfig: this.influxdbFieldConfig,
        mattermostFieldConfig: this.mattermostFieldConfig,
        opsgenieFieldConfig: this.opsgenieFieldConfig,
        htpchatFieldConfig: this.htpchatFieldConfig,
        pagerdutyFieldConfig: this.pagerdutyFieldConfig,
        victoropsFieldConfig: this.victoropsFieldConfig,
      },
      {
        name:'divider',
        divider:true,
        width:'100%'
      }
    ];

    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
    this.emailFormGroup = this.entityFormService.createFormGroup(this.emailFieldConfig);
    this.snmpTrapFormGroup = this.entityFormService.createFormGroup(this.snmpTrapFieldConfig);
    this.slackFormGroup = this.entityFormService.createFormGroup(this.slackFieldConfig);
    this.awssnsFormGroup = this.entityFormService.createFormGroup(this.awssnsFieldConfig);
    this.influxdbFormGroup = this.entityFormService.createFormGroup(this.influxdbFieldConfig);
    this.mattermostFormGroup = this.entityFormService.createFormGroup(this.mattermostFieldConfig);
    this.opsgenieFormGroup = this.entityFormService.createFormGroup(this.opsgenieFieldConfig);
    this.htpchatFormGroup = this.entityFormService.createFormGroup(this.htpchatFieldConfig);
    this.pagerdutyFormGroup = this.entityFormService.createFormGroup(this.pagerdutyFieldConfig);
    this.victoropsFormGroup = this.entityFormService.createFormGroup(this.victoropsFieldConfig);

    this.activeFormGroup = this.awssnsFormGroup;
    this.formGroup.controls['type'].valueChanges.subscribe((res) => {
      this.selectedType = res;
      if (res == 'Mail') {
        this.activeFormGroup = this.emailFormGroup;
      } else if (res == 'SNMPTrap') {
        this.activeFormGroup = this.snmpTrapFormGroup;
      } else if (res == 'Slack') {
        this.activeFormGroup = this.slackFormGroup;
      } else if (res == 'AWSSNS') {
        this.activeFormGroup = this.awssnsFormGroup;
      } else if (res == 'InfluxDB') {
        this.activeFormGroup = this.influxdbFormGroup;
      } else if (res == 'Mattermost') {
        this.activeFormGroup = this.mattermostFormGroup;
      } else if (res == 'OpsGenie') {
        this.activeFormGroup = this.opsgenieFormGroup;
      } else if (res == 'HtpChat') {
        this.activeFormGroup = this.htpchatFormGroup;
      } else if (res == 'PagerDuty') {
        this.activeFormGroup = this.pagerdutyFormGroup;
      } else if (res == 'VictorOps') {
        this.activeFormGroup = this.victoropsFormGroup;
      }
    });

    this.route.params.subscribe(params => {
      this.pk = params['pk'];
      if (this.pk) {
        this.isNew = false;
        this.ws.call(this.queryCall, [
          [
            ['id', '=', Number(this.pk)]
          ]
        ]).subscribe((res) => {
          for (const i in this.formGroup.controls) {
            this.formGroup.controls[i].setValue(res[0][i]);
          }
          for (const j in this.activeFormGroup.controls) {
            this.activeFormGroup.controls[j].setValue(res[0].attributes[j]);
          }
        })
      } else {
        this.isNew = true;
      }
    });
  }

  onSubmit(event: Event) {
    let payload = _.cloneDeep(this.formGroup.value);
    let serviceValue = _.cloneDeep(this.activeFormGroup.value);

    payload['attributes'] = serviceValue;

    this.loader.open();
    if (this.isNew) {
      this.ws.call(this.addCall, [payload]).subscribe(
        (res) => {
          this.loader.close();
          this.router.navigate(new Array('/').concat(this.route_success));
        },
        (res) => {
          this.loader.close();
          new EntityUtils().handleError(this, res);
        });
    } else {
      this.ws.call(this.editCall, [this.pk, payload]).subscribe(
        (res) => {
          this.loader.close();
          this.router.navigate(new Array('/').concat(this.route_success));
        },
        (res) => {
          this.loader.close();
          new EntityUtils().handleError(this, res);
        });
    }

  }

  sendTestAlet() {
    let testPayload = _.cloneDeep(this.formGroup.value);
    let serviceValue = _.cloneDeep(this.activeFormGroup.value);

    testPayload['attributes'] = serviceValue;

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
      (res) => {
        this.loader.close();
        new EntityUtils().handleError(this, res);
      });
  }

  goBack() {
    this.router.navigate(new Array('/').concat(this.route_success));
  }
}
