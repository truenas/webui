import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FieldRelationService } from '../../../common/entity/entity-form/services/field-relation.service';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-alertservice',
  templateUrl: './alert-service.component.html',
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
  public selectedType = 'Mail';

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'name',
      placeholder: 'Name',
    },
    {
      type: 'checkbox',
      name: 'enabled',
      placeholder: 'Enabled',
      value: false,
    },
    {
      type: 'select',
      name: 'type',
      placeholder: 'Type',
      options: [{
        label: 'AWS SNS',
        value: 'AWSSNS',
      }, {
        label: 'E-Mail',
        value: 'Mail',
      }, {
        label: 'InfluxDB',
        value: 'InfluxDB',
      }, {
        label: 'Slack',
        value: 'Slack',
      }, {
        label: 'SNMP Trap',
        value: 'SNMPTrap',
      }],
      value: 'Mail',
    },
  ];

  public emailFieldConfig: FieldConfig[] = [{
    type: 'input',
    inputType: 'email',
    name: 'email_address',
    placeholder: 'E-mail address',
  }];

  public snmpTrapFieldConfig: FieldConfig[] = [];

  public slackFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'username',
      placeholder: 'Username',
      tooltip: 'Enter the Slack username.',
    }, {
      type: 'input',
      name: 'cluster_name',
      placeholder: 'Cluster name',
      tooltip: 'Enter the name of the cluster. This is optional and can\
   be left blank.',
    }, {
      type: 'input',
      name: 'url',
      placeholder: 'Webhook URL',
      tooltip: 'Paste the incoming webhook URL associated with this\
   service. Refer to the <a href="https://api.slack.com/incoming-webhooks"\
   target="_blank">Slack API documentation</a> for more information about\
   setting up incoming webhooks.',
    }, {
      type: 'input',
      name: 'channel',
      placeholder: 'Channel',
      tooltip: 'Enter a Slack channel for the Incoming WebHook to post\
   messages to it.',
    }, {
      type: 'input',
      name: 'icon_url',
      placeholder: 'Icon URL',
      tooltip: 'URL of a custom image for notification icons. This\
   overrides the default if set in the Incoming Webhook settings. This\
   field is optional and can be left blank.',
    }, {
      type: 'checkbox',
      name: 'detailed',
      placeholder: 'Detailed',
      tooltip: 'Enable detailed Slack notifications.',
      value: true,
    }
  ];

  public awssnsFieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'region',
      placeholder : 'Region',
      tooltip: 'Paste the region for the AWS account here.',
    }, {
      type: 'input',
      name: 'topic_arn',
      placeholder: 'ARN',
      tooltip: 'Enter the Topic Amazon Resource Name (ARN) for\
     publishing. Here is an example ARN:\
     <b>arn:aws:sns:us-west-2:111122223333:MyTopic</b>.',
    },
    // {
    //   type : 'input',
    //   name : 'base_url',
    //   placeholder : 'Base URL',
    //   value: 'http://s3.example.com',
    //   tooltip: 'Enter the base url for the S3 system.',
    // },
    {
      type : 'input',
      name : 'aws_access_key_id',
      placeholder : 'Key ID',
      tooltip: 'Enter the AWS Access Key ID for the AWS account.',
    }, {
      type: 'input',
      name: 'aws_secret_access_key',
      placeholder: 'Secret Key',
      tooltip: 'Enter the AWS Secret Access Key for the AWS account.',
    },
  ];
  // public htpchatFieldConfig: FieldConfig[] = [];
  public influxdbFieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'username',
      placeholder: 'Username',
      tooltip: 'Enter the username for this service.',
    }, {
      type : 'input',
      name : 'password',
      placeholder: 'Password',
      tooltip: 'Enter password.',
    }, {
      type : 'input',
      name : 'host',
      placeholder: 'Host',
      tooltip: 'Enter the InfluxDB host.',
    }, {
      type : 'input',
      name : 'database',
      placeholder: 'Database',
      tooltip: 'Enter the InfluxDB database name.',
    }, {
      type : 'input',
      name : 'series_name',
      placeholder: 'Series',
      tooltip: 'Enter the InfluxDB series name for the points.',
    }
  ];
  // public mattermostFieldConfig: FieldConfig[] = [];
  // public opsgenieFieldConfig: FieldConfig[] = [];
  // public pagerdutyFieldConfig: FieldConfig[] = [];
  // public victoropsFieldConfig: FieldConfig[] = [];

  public formGroup: any;
  public activeFormGroup: any;
  public emailFormGroup: any;
  public snmpTrapFormGroup: any;
  public slackFormGroup: any;
  public awssnsFormGroup: any;
  public influxdbFormGroup: any;

  constructor(protected router: Router,
    protected route: ActivatedRoute,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected entityFormService: EntityFormService,
    protected fieldRelationService: FieldRelationService,
    protected loader: AppLoaderService,
    protected snackBar: MatSnackBar, ) {}

  ngOnInit() {
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
    this.emailFormGroup = this.entityFormService.createFormGroup(this.emailFieldConfig);
    this.snmpTrapFormGroup = this.entityFormService.createFormGroup(this.snmpTrapFieldConfig);
    this.slackFormGroup = this.entityFormService.createFormGroup(this.slackFieldConfig);
    this.awssnsFormGroup = this.entityFormService.createFormGroup(this.awssnsFieldConfig);
    this.influxdbFormGroup = this.entityFormService.createFormGroup(this.influxdbFieldConfig);

    this.activeFormGroup = this.emailFormGroup;
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
      }
    });

    this.route.params.subscribe(params => {
      this.pk = params['pk'];
      if (this.pk) {
        this.isNew = false;
        this.ws.call(this.queryCall, [
          [
            ['id', '=', this.pk]
          ]
        ]).subscribe((res) => {
          console.log(res[0]);
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
    console.log(this.formGroup.value, this.activeFormGroup.value);
    let payload = _.cloneDeep(this.formGroup.value);
    let serviceValue = _.cloneDeep(this.activeFormGroup.value);

    payload['attributes'] = serviceValue;
    payload['settings'] = {};

    this.loader.open();
    if (this.isNew) {
      this.ws.call(this.addCall, [payload]).subscribe(
        (res) => {
          this.loader.close();
          this.router.navigate(new Array('/').concat(this.route_success));
        },
        (res) => {
          this.loader.close();
        });
    } else {
      this.ws.call(this.editCall, [this.pk, payload]).subscribe(
        (res) => {
          this.loader.close();
          this.router.navigate(new Array('/').concat(this.route_success));
        },
        (res) => {
          this.loader.close();
          console.log(res);
        });
    }

  }

  sendTestAlet() {
    console.log('send test alert');
    let testPayload = _.cloneDeep(this.formGroup.value);
    let serviceValue = _.cloneDeep(this.activeFormGroup.value);

    testPayload['attributes'] = serviceValue;
    testPayload['settings'] = {};

    this.loader.open();
    this.ws.call(this.testCall, [testPayload]).subscribe(
      (res) => {
        this.loader.close();
        if (res) {
          this.snackBar.open('A test alert send out successfully!', 'close', { duration: 5000 });
        } else {
          this.snackBar.open('A test alert send out failed!', 'close', { duration: 5000 });
        }
      },
      (res) => {
        this.loader.close();
        console.log(res);
      });
  }

  goBack() {
    this.router.navigate(new Array('/').concat(this.route_success));
  }
}
