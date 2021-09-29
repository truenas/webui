import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { AlertServiceType } from 'app/enums/alert-service-type.enum';
import helptext from 'app/helptext/system/alert-service';
import { AlertService, AlertServiceCreate } from 'app/interfaces/alert-service.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { RelationConnection } from 'app/pages/common/entity/entity-form/models/relation-connection.enum';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService, AppLoaderService, DialogService } from 'app/services/';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-alertservice',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [EntityFormService],
})
export class AlertServiceComponent implements FormConfiguration {
  addCall: 'alertservice.create' = 'alertservice.create';
  queryCall: 'alertservice.query' = 'alertservice.query';
  queryCallOption: [Partial<QueryFilter<AlertService>>] = [['id', '=']];
  editCall: 'alertservice.update' = 'alertservice.update';
  testCall: 'alertservice.test' = 'alertservice.test';
  route_success: string[] = ['system', 'alertservice'];

  isEntity = true;
  entityForm: EntityFormComponent;

  fieldConfig: FieldConfig[];
  fieldSets: FieldSet[] = [
    {
      name: helptext.fieldset_basic,
      label: true,
      class: 'basic',
      width: '49%',
      config: [
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
            value: AlertServiceType.AwsSns,
          }, {
            label: 'E-Mail',
            value: AlertServiceType.Mail,
          }, {
            label: 'InfluxDB',
            value: AlertServiceType.InfluxDb,
          }, {
            label: 'Mattermost',
            value: AlertServiceType.Mattermost,
          }, {
            label: 'OpsGenie',
            value: AlertServiceType.OpsGenie,
          }, {
            label: 'PagerDuty',
            value: AlertServiceType.PagerDuty,
          }, {
            label: 'Slack',
            value: AlertServiceType.Slack,
          }, {
            label: 'SNMP Trap',
            value: AlertServiceType.SnmpTrap,
          }, {
            label: 'Telegram',
            value: AlertServiceType.Telegram,
          }, {
            label: 'VictorOps',
            value: AlertServiceType.VictorOps,
          }],
          value: AlertServiceType.AwsSns,
        },
        {
          type: 'select',
          name: 'level',
          placeholder: helptext.level_placeholder,
          tooltip: helptext.level_tooltip,
          options: [
            { label: T('Info'), value: AlertLevel.Info },
            { label: T('Notice'), value: AlertLevel.Notice },
            { label: T('Warning'), value: AlertLevel.Warning },
            { label: T('Error'), value: AlertLevel.Error },
            { label: T('Critical'), value: AlertLevel.Critical },
            { label: T('Alert'), value: AlertLevel.Alert },
            { label: T('Emergency'), value: AlertLevel.Emergency },
          ],
          value: AlertLevel.Warning,
        },
      ],
    },
    {
      name: helptext.fieldset_setting,
      label: true,
      class: 'setting',
      width: '49%',
      config: [
        // AWSSNS
        {
          type: 'input',
          name: 'AWSSNS-region',
          placeholder: helptext.AWSSNS_region_placeholder,
          tooltip: helptext.AWSSNS_region_tooltip,
          required: true,
          validation: [Validators.required],
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.AwsSns,
            }],
          }],
        }, {
          type: 'input',
          name: 'AWSSNS-topic_arn',
          placeholder: helptext.AWSSNS_topic_arn_placeholder,
          tooltip: helptext.AWSSNS_topic_arn_tooltip,
          required: true,
          validation: [Validators.required],
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.AwsSns,
            }],
          }],
        }, {
          type: 'input',
          name: 'AWSSNS-aws_access_key_id',
          placeholder: helptext.AWSSNS_aws_access_key_id_placeholder,
          tooltip: helptext.AWSSNS_aws_access_key_id_tooltip,
          required: true,
          validation: [Validators.required],
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.AwsSns,
            }],
          }],
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
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.AwsSns,
            }],
          }],
        },
        // Mail
        {
          type: 'input',
          inputType: 'email',
          name: 'Mail-email',
          placeholder: helptext.Mail_email_placeholder,
          tooltip: helptext.Mail_email_tooltip,
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.Mail,
            }],
          }],
        },
        // InfluxDB
        {
          type: 'input',
          name: 'InfluxDB-host',
          placeholder: helptext.InfluxDB_host_placeholder,
          tooltip: helptext.InfluxDB_host_tooltip,
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.InfluxDb,
            }],
          }],
          required: true,
          validation: [Validators.required],
        }, {
          type: 'input',
          name: 'InfluxDB-username',
          placeholder: helptext.InfluxDB_username_placeholder,
          tooltip: helptext.InfluxDB_username_tooltip,
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.InfluxDb,
            }],
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
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.InfluxDb,
            }],
          }],
          required: true,
          validation: [Validators.required],
        }, {
          type: 'input',
          name: 'InfluxDB-database',
          placeholder: helptext.InfluxDB_database_placeholder,
          tooltip: helptext.InfluxDB_database_tooltip,
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.InfluxDb,
            }],
          }],
          required: true,
          validation: [Validators.required],
        }, {
          type: 'input',
          name: 'InfluxDB-series_name',
          placeholder: helptext.InfluxDB_series_name_placeholder,
          tooltip: helptext.InfluxDB_series_name_tooltip,
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.InfluxDb,
            }],
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
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.Mattermost,
            }],
          }],
          required: true,
          validation: [Validators.required],
        }, {
          type: 'input',
          name: 'Mattermost-username',
          placeholder: helptext.Mattermost_username_placeholder,
          tooltip: helptext.Mattermost_username_tooltip,
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.Mattermost,
            }],
          }],
          required: true,
          validation: [Validators.required],
        }, {
          type: 'input',
          name: 'Mattermost-channel',
          placeholder: helptext.Mattermost_channel_placeholder,
          tooltip: helptext.Mattermost_channel_tooltip,
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.Mattermost,
            }],
          }],
        }, {
          type: 'input',
          name: 'Mattermost-icon_url',
          placeholder: helptext.Mattermost_icon_url_placeholder,
          tooltip: helptext.Mattermost_icon_url_tooltip,
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.Mattermost,
            }],
          }],
        },
        // OpsGenie
        {
          type: 'input',
          name: 'OpsGenie-api_key',
          placeholder: helptext.OpsGenie_api_key_placeholder,
          tooltip: helptext.OpsGenie_api_key_tooltip,
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.OpsGenie,
            }],
          }],
          required: true,
          validation: [Validators.required],
        }, {
          type: 'input',
          name: 'OpsGenie-api_url',
          placeholder: helptext.OpsGenie_api_url_placeholder,
          tooltip: helptext.OpsGenie_api_url_tooltip,
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.OpsGenie,
            }],
          }],
        },
        // PagerDuty
        {
          type: 'input',
          name: 'PagerDuty-service_key',
          placeholder: helptext.PagerDuty_service_key_placeholder,
          tooltip: helptext.PagerDuty_service_key_tooltip,
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.PagerDuty,
            }],
          }],
          required: true,
          validation: [Validators.required],
        }, {
          type: 'input',
          name: 'PagerDuty-client_name',
          placeholder: helptext.PagerDuty_client_name_placeholder,
          tooltip: helptext.PagerDuty_client_name_tooltip,
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.PagerDuty,
            }],
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
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.Slack,
            }],
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
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.SnmpTrap,
            }],
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
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.SnmpTrap,
            }],
          }],
          value: 162,
        },
        {
          type: 'checkbox',
          name: 'SNMPTrap-v3',
          placeholder: helptext.SNMPTrap_v3_placeholder,
          tooltip: helptext.SNMPTrap_v3_tooltip,
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.SnmpTrap,
            }],
          }],
          value: false,
        },
        {
          type: 'input',
          name: 'SNMPTrap-v3_username',
          placeholder: helptext.SNMPTrap_v3_username_placeholder,
          tooltip: helptext.SNMPTrap_v3_username_tooltip,
          relation: [{
            action: RelationAction.Show,
            connective: RelationConnection.And,
            when: [{
              name: 'type',
              value: AlertServiceType.SnmpTrap,
            }, {
              name: 'SNMPTrap-v3',
              value: true,
            }],
          }],
        },
        {
          type: 'input',
          name: 'SNMPTrap-v3_authkey',
          placeholder: helptext.SNMPTrap_v3_authkey_placeholder,
          tooltip: helptext.SNMPTrap_v3_authkey_tooltip,
          relation: [{
            action: RelationAction.Show,
            connective: RelationConnection.And,
            when: [{
              name: 'type',
              value: AlertServiceType.SnmpTrap,
            }, {
              name: 'SNMPTrap-v3',
              value: true,
            }],
          }],
        },
        {
          type: 'input',
          name: 'SNMPTrap-v3_privkey',
          placeholder: helptext.SNMPTrap_v3_privkey_placeholder,
          tooltip: helptext.SNMPTrap_v3_privkey_tooltip,
          relation: [{
            action: RelationAction.Show,
            connective: RelationConnection.And,
            when: [{
              name: 'type',
              value: AlertServiceType.SnmpTrap,
            }, {
              name: 'SNMPTrap-v3',
              value: true,
            }],
          }],
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
            },
          ],
          value: '',
          relation: [{
            action: RelationAction.Show,
            connective: RelationConnection.And,
            when: [{
              name: 'type',
              value: AlertServiceType.SnmpTrap,
            }, {
              name: 'SNMPTrap-v3',
              value: true,
            }],
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
            },
          ],
          value: '',
          relation: [{
            action: RelationAction.Show,
            connective: RelationConnection.And,
            when: [{
              name: 'type',
              value: AlertServiceType.SnmpTrap,
            }, {
              name: 'SNMPTrap-v3',
              value: true,
            }],
          }],
        },
        {
          type: 'input',
          name: 'SNMPTrap-community',
          placeholder: helptext.SNMPTrap_community_placeholder,
          tooltip: helptext.SNMPTrap_community_tooltip,
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.SnmpTrap,
            }],
          }],
          value: 'public',
        },
        // Telegram
        {
          type: 'input',
          name: 'Telegram-bot_token',
          placeholder: helptext.Telegram_bot_token_placeholder,
          tooltip: helptext.Telegram_bot_token_tooltip,
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.Telegram,
            }],
          }],
          required: true,
          validation: [Validators.required],
        },
        {
          type: 'chip',
          name: 'Telegram-chat_ids',
          placeholder: helptext.Telegram_chat_ids_placeholder,
          tooltip: helptext.Telegram_chat_ids_tooltip,
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.Telegram,
            }],
          }],
          required: true,
          validation: [Validators.required],
        },
        // VictorOps
        {
          type: 'input',
          name: 'VictorOps-api_key',
          placeholder: helptext.VictorOps_api_key_placeholder,
          tooltip: helptext.VictorOps_api_key_tooltip,
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.VictorOps,
            }],
          }],
          required: true,
          validation: [Validators.required],
        }, {
          type: 'input',
          name: 'VictorOps-routing_key',
          placeholder: helptext.VictorOps_routing_key_placeholder,
          tooltip: helptext.VictorOps_routing_key_tooltip,
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'type',
              value: AlertServiceType.VictorOps,
            }],
          }],
          required: true,
          validation: [Validators.required],
        },
      ],
    },
  ];

  custActions = [
    {
      id: 'authenticate',
      name: T('SEND TEST ALERT'),
      function: () => {
        this.entityFormService.clearFormError(this.fieldConfig);
        const testPayload = this.generatePayload(_.cloneDeep(this.entityForm.formGroup.value));

        this.loader.open();
        this.ws.call(this.testCall, [testPayload]).pipe(untilDestroyed(this)).subscribe(
          (wasAlertSent) => {
            this.loader.close();
            if (wasAlertSent) {
              this.dialogService.info(T('Succeeded'), T('Test alert sent!'), '500px', 'info');
            } else {
              this.dialogService.info(T('Failed'), T('Failed sending test alert!'));
            }
          },
          (err: WebsocketError) => {
            this.loader.close();
            new EntityUtils().handleWSError(this, err, this.dialogService);
          },
        );
      },
    },
  ];

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected entityFormService: EntityFormService,
    protected loader: AppLoaderService,
    protected dialogService: DialogService,
  ) { }

  preInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      if (params['pk']) {
        this.queryCallOption[0].push(Number(params['pk']));
      }
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.fieldConfig = entityForm.fieldConfig;
  }

  dataAttributeHandler(entityForm: EntityFormComponent): void {
    const type = entityForm.formGroup.controls['type'].value;
    for (const i in entityForm.wsResponseIdx) {
      const fieldName = type + '-' + i;
      if (entityForm.formGroup.controls[fieldName]) {
        if ((i === 'v3_authprotocol' || i === 'v3_privprotocol') && entityForm.wsResponseIdx[i] === null) {
          entityForm.wsResponseIdx[i] = '';
        }
        entityForm.formGroup.controls[fieldName].setValue(entityForm.wsResponseIdx[i]);
      }
    }
  }

  generateTelegramChatIdsPayload(data: any, i: string): number[] {
    const wrongChatIds: string[] = [];
    // Telegram chat IDs must be an array of integer
    const arrayChatIds: number[] = data[i].map((strChatId: string) => {
      const chatId = Number(strChatId);
      if (isNaN(chatId)) {
        wrongChatIds.push(strChatId);
      }
      return chatId;
    });
    if (wrongChatIds.length > 0) {
      this.dialogService.info(T('Failed'), T('The following Telegram chat ID(s) must be numbers!') + '\n\n' + wrongChatIds.join(', '));
      throw new Error('Telegram-chat_ids must be an array of integer');
    }
    // Avoid duplicated chat IDs
    return Array.from(new Set(arrayChatIds));
  }

  generatePayload(data: any): AlertServiceCreate {
    const payload: AlertServiceCreate = {
      attributes: {},
      enabled: data.enabled,
      level: data.level,
      name: data.name,
      type: data.type,
    };
    if (data['Telegram-chat_ids']) {
      data['Telegram-chat_ids'] = this.generateTelegramChatIdsPayload(data, 'Telegram-chat_ids');
    }
    data['SNMPTrap-v3_authprotocol'] = data['SNMPTrap-v3_authprotocol'] === '' ? null : data['SNMPTrap-v3_authprotocol'];
    data['SNMPTrap-v3_privprotocol'] = data['SNMPTrap-v3_privprotocol'] === '' ? null : data['SNMPTrap-v3_privprotocol'];
    for (const i in data) {
      if (i.split('-').length > 1) {
        payload['attributes'][i.split('-')[1]] = data[i];
      }
    }
    return payload;
  }

  customSubmit(value: any): void {
    this.entityFormService.clearFormError(this.fieldConfig);
    const payload = this.generatePayload(value);

    this.loader.open();
    if (this.entityForm.isNew) {
      this.ws.call(this.addCall, [payload]).pipe(untilDestroyed(this)).subscribe(
        () => {
          this.loader.close();
          this.router.navigate(new Array('/').concat(this.route_success));
        },
        (err: WebsocketError) => {
          this.loader.close();
          new EntityUtils().handleWSError(this, err, this.dialogService);
        },
      );
    } else {
      this.ws.call(this.editCall, [this.entityForm.pk, payload]).pipe(untilDestroyed(this)).subscribe(
        () => {
          this.loader.close();
          this.router.navigate(new Array('/').concat(this.route_success));
        },
        (err: WebsocketError) => {
          this.loader.close();
          new EntityUtils().handleWSError(this, err, this.dialogService);
        },
      );
    }
  }

  getErrorField(field: string): FieldConfig {
    return _.find(this.fieldConfig, { name: this.entityForm.formGroup.controls['type'].value + '-' + field });
  }
}
