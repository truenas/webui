import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { UntypedFormArray, UntypedFormGroup, Validators } from '@angular/forms';
import { ITreeOptions, TreeNode } from '@circlon/angular-tree-component';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { lastValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { CipherType } from 'app/enums/cipher-type.enum';
import { DatasetSource } from 'app/enums/dataset.enum';
import { Direction } from 'app/enums/direction.enum';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { ExplorerType } from 'app/enums/explorer-type.enum';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { NetcatMode } from 'app/enums/netcat-mode.enum';
import { ReadOnlyMode } from 'app/enums/readonly-mode.enum';
import { RetentionPolicy } from 'app/enums/retention-policy.enum';
import { ScheduleMethod } from 'app/enums/schedule-method.enum';
import { SnapshotNamingOption } from 'app/enums/snapshot-naming-option.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import helptext from 'app/helptext/data-protection/replication/replication-wizard';
import sshConnectionsHelptex from 'app/helptext/system/ssh-connections';
import { CountManualSnapshotsParams } from 'app/interfaces/count-manual-snapshots.interface';
import { WizardConfiguration } from 'app/interfaces/entity-wizard.interface';
import {
  KeychainCredential,
  KeychainCredentialCreate,
  KeychainSshCredentials,
} from 'app/interfaces/keychain-credential.interface';
import { ListdirChild } from 'app/interfaces/listdir-child.interface';
import { PeriodicSnapshotTask, PeriodicSnapshotTaskCreate } from 'app/interfaces/periodic-snapshot-task.interface';
import { ReplicationCreate, ReplicationTask } from 'app/interfaces/replication-task.interface';
import { Schedule } from 'app/interfaces/schedule.interface';
import { SshSemiAutomaticSetup } from 'app/interfaces/ssh-connection-setup.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import {
  FieldConfig,
  FormExplorerConfig,
  FormParagraphConfig,
  FormSelectConfig,
} from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/modules/entity/entity-form/models/relation-action.enum';
import { RelationConnection } from 'app/modules/entity/entity-form/models/relation-connection.enum';
import { Wizard } from 'app/modules/entity/entity-form/models/wizard.interface';
import { EntityFormService } from 'app/modules/entity/entity-form/services/entity-form.service';
import { forbiddenValues } from 'app/modules/entity/entity-form/validators/forbidden-values-validation';
import { EntityWizardComponent } from 'app/modules/entity/entity-wizard/entity-wizard.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { CronPresetValue } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import {
  AppLoaderService,
  DialogService,
  KeychainCredentialService,
  ReplicationService,
  TaskService,
  WebSocketService,
} from 'app/services';
import { ModalService } from 'app/services/modal.service';

interface CreatedItems {
  periodic_snapshot_tasks?: number[];
  snapshot?: ZfsSnapshot[];
  replication?: number;
  private_key?: number;
  ssh_credentials?: number;
}

@UntilDestroy()
@Component({
  template: '<ix-entity-wizard [conf]="this"></ix-entity-wizard>',
  providers: [KeychainCredentialService, ReplicationService, TaskService, DatePipe, EntityFormService],
})
export class ReplicationWizardComponent implements WizardConfiguration {
  title = this.translate.instant('Replication Task Wizard');
  isLinear = true;
  summaryTitle = this.translate.instant('Replication Summary');
  pk: number;
  saveSubmitText = this.translate.instant('START REPLICATION');
  hideCancel = true;

  protected entityWizard: EntityWizardComponent;
  customActions = [{
    id: 'advanced_add',
    name: this.translate.instant('Advanced Replication Creation'),
    function: () => {
      this.modalService.closeSlideIn();
      const message = { action: 'open', component: 'replicationForm', row: this.pk };
      this.modalService.message(message);
    },
  }];
  protected namesInUse: string[] = [];
  protected defaultNamingSchema = 'auto-%Y-%m-%d_%H-%M';
  wizardConfig: Wizard[] = [
    {
      label: helptext.step1_label,
      fieldSets: [
        {
          name: 'preload',
          label: false,
          class: 'preload',
          width: '100%',
          config: [
            {
              type: 'select',
              name: 'exist_replication',
              placeholder: helptext.exist_replication_placeholder,
              tooltip: helptext.exist_replication_tooltip,
              options: [{
                label: '---------',
                value: '',
              }],
              value: '',
            },
          ],
        },
        {
          name: 'source',
          label: false,
          class: 'source',
          width: '50%',
          config: [
            {
              type: 'select',
              name: 'source_datasets_from',
              placeholder: helptext.source_datasets_from_placeholder,
              tooltip: helptext.source_datasets_from_tooltip,
              options: [{
                label: this.translate.instant('On this System'),
                value: DatasetSource.Local,
              }, {
                label: this.translate.instant('On a Different System'),
                value: DatasetSource.Remote,
              }],
              required: true,
              validation: [Validators.required],
            },
            {
              type: 'select',
              name: 'ssh_credentials_source',
              placeholder: helptext.ssh_credentials_source_placeholder,
              tooltip: helptext.ssh_credentials_source_tooltip,
              options: [],
              relation: [{
                action: RelationAction.Show,
                when: [{
                  name: 'source_datasets_from',
                  value: DatasetSource.Remote,
                }],
              }],
              isHidden: true,
              required: true,
              validation: [Validators.required],
            },
            {
              type: 'explorer',
              name: 'source_datasets',
              placeholder: helptext.source_datasets_placeholder,
              tooltip: helptext.source_datasets_tooltip,
              initial: '',
              explorerType: ExplorerType.Directory,
              multiple: true,
              customTemplateStringOptions: {
                displayField: 'Path',
                isExpandedField: 'expanded',
                idField: 'uuid',
                getChildren: this.getSourceChildren.bind(this),
                nodeHeight: 23,
                allowDrag: false,
                useVirtualScroll: false,
                useCheckbox: true,
                useTriState: false,
              } as ITreeOptions,
              required: true,
              validation: [Validators.required],
              relation: [{
                action: RelationAction.Show,
                connective: RelationConnection.Or,
                when: [{
                  name: 'source_datasets_from',
                  value: DatasetSource.Remote,
                }, {
                  name: 'source_datasets_from',
                  value: DatasetSource.Local,
                }],
              }],
            },
            {
              type: 'checkbox',
              name: 'recursive',
              placeholder: helptext.recursive_placeholder,
              tooltip: helptext.recursive_tooltip,
              value: false,
              relation: [{
                action: RelationAction.Show,
                connective: RelationConnection.Or,
                when: [{
                  name: 'source_datasets_from',
                  value: DatasetSource.Remote,
                }, {
                  name: 'source_datasets_from',
                  value: DatasetSource.Local,
                }],
              }],
            },
            {
              type: 'paragraph',
              name: 'snapshots_count',
              paraText: '',
              relation: [{
                action: RelationAction.Show,
                connective: RelationConnection.Or,
                when: [{
                  name: 'source_datasets_from',
                  value: DatasetSource.Remote,
                }, {
                  name: 'source_datasets_from',
                  value: DatasetSource.Local,
                }],
              }],
            },
            {
              type: 'checkbox',
              name: 'custom_snapshots',
              placeholder: helptext.custom_snapshots_placeholder,
              tooltip: helptext.custom_snapshots_tooltip,
              value: false,
              relation: [{
                action: RelationAction.Show,
                when: [{
                  name: 'source_datasets_from',
                  value: DatasetSource.Local,
                }],
              }],
            },
            {
              type: 'radio',
              name: 'schema_or_regex',
              placeholder: helptext.name_schema_or_regex_placeholder_push,
              options: [
                { label: helptext.naming_schema_placeholder, value: SnapshotNamingOption.NamingSchema },
                { label: helptext.name_regex_placeholder, value: SnapshotNamingOption.NameRegex },
              ],
              value: SnapshotNamingOption.NamingSchema,
            },
            {
              type: 'input',
              name: 'naming_schema',
              placeholder: helptext.naming_schema_placeholder,
              tooltip: helptext.naming_schema_tooltip,
              value: this.defaultNamingSchema,
              parent: this,
              blurStatus: true,
              blurEvent: () => {
                this.getSnapshots();
              },
            },
            {
              type: 'input',
              name: 'name_regex',
              placeholder: helptext.name_regex_placeholder,
              tooltip: helptext.name_regex_tooltip,
              parent: this,
              isHidden: true,
              blurEvent: () => {
                this.getSnapshots();
              },
            },
          ],
        },
        {
          name: 'target',
          label: false,
          class: 'target',
          width: '50%',
          config: [
            {
              type: 'select',
              name: 'target_dataset_from',
              placeholder: helptext.target_dataset_from_placeholder,
              tooltip: helptext.target_dataset_from_tooltip,
              options: [{
                label: this.translate.instant('On this System'),
                value: DatasetSource.Local,
              }, {
                label: this.translate.instant('On a Different System'),
                value: DatasetSource.Remote,
              }],
              required: true,
              validation: [Validators.required],
            },
            {
              type: 'select',
              name: 'ssh_credentials_target',
              placeholder: helptext.ssh_credentials_target_placeholder,
              tooltip: helptext.ssh_credentials_target_tooltip,
              options: [],
              relation: [{
                action: RelationAction.Show,
                when: [{
                  name: 'target_dataset_from',
                  value: DatasetSource.Remote,
                }],
              }],
              isHidden: true,
              required: true,
              validation: [Validators.required],
            },
            {
              type: 'explorer',
              name: 'target_dataset',
              placeholder: helptext.target_dataset_placeholder,
              tooltip: helptext.target_dataset_tooltip,
              initial: '',
              explorerType: ExplorerType.Directory,
              customTemplateStringOptions: {
                displayField: 'Path',
                isExpandedField: 'expanded',
                idField: 'uuid',
                getChildren: this.getTargetChildren.bind(this),
                nodeHeight: 23,
                allowDrag: false,
                useVirtualScroll: false,
              },
              required: true,
              validation: [Validators.required],
              relation: [{
                action: RelationAction.Show,
                connective: RelationConnection.Or,
                when: [{
                  name: 'target_dataset_from',
                  value: DatasetSource.Remote,
                }, {
                  name: 'target_dataset_from',
                  value: DatasetSource.Local,
                }],
              }],
            },
            {
              type: 'checkbox',
              name: 'encryption',
              placeholder: helptext.encryption_placeholder,
              tooltip: helptext.encryption_tooltip,
              value: false,
              relation: [{
                action: RelationAction.Show,
                connective: RelationConnection.Or,
                when: [{
                  name: 'target_dataset_from',
                  value: DatasetSource.Remote,
                }, {
                  name: 'target_dataset_from',
                  value: DatasetSource.Local,
                }],
              }],
            },
            {
              type: 'select',
              name: 'encryption_key_format',
              placeholder: helptext.encryption_key_format_placeholder,
              tooltip: helptext.encryption_key_format_tooltip,
              options: [{
                label: this.translate.instant('HEX'),
                value: EncryptionKeyFormat.Hex,
              }, {
                label: this.translate.instant('PASSPHRASE'),
                value: EncryptionKeyFormat.Passphrase,
              }],
              relation: [{
                action: RelationAction.Show,
                when: [{
                  name: 'encryption',
                  value: true,
                }],
              }],
            },
            {
              type: 'checkbox',
              name: 'encryption_key_generate',
              placeholder: helptext.encryption_key_generate_placeholder,
              tooltip: helptext.encryption_key_generate_tooltip,
              value: true,
              relation: [{
                action: RelationAction.Show,
                connective: RelationConnection.And,
                when: [{
                  name: 'encryption',
                  value: true,
                }, {
                  name: 'encryption_key_format',
                  value: EncryptionKeyFormat.Hex,
                }],
              }],
            },
            {
              type: 'input',
              name: 'encryption_key_hex',
              placeholder: helptext.encryption_key_hex_placeholder,
              tooltip: helptext.encryption_key_hex_tooltip,
              relation: [{
                action: RelationAction.Show,
                connective: RelationConnection.And,
                when: [{
                  name: 'encryption',
                  value: true,
                }, {
                  name: 'encryption_key_format',
                  value: EncryptionKeyFormat.Hex,
                }, {
                  name: 'encryption_key_generate',
                  value: false,
                }],
              }],
            },
            {
              type: 'input',
              inputType: 'password',
              togglePw: true,
              name: 'encryption_key_passphrase',
              placeholder: helptext.encryption_key_passphrase_placeholder,
              tooltip: helptext.encryption_key_passphrase_tooltip,
              relation: [{
                action: RelationAction.Show,
                connective: RelationConnection.And,
                when: [{
                  name: 'encryption',
                  value: true,
                }, {
                  name: 'encryption_key_format',
                  value: EncryptionKeyFormat.Passphrase,
                }],
              }],
            },
            {
              type: 'checkbox',
              name: 'encryption_key_location_truenasdb',
              placeholder: helptext.encryption_key_location_truenasdb_placeholder,
              tooltip: helptext.encryption_key_location_truenasdb_tooltip,
              value: true,
              relation: [{
                action: RelationAction.Show,
                when: [{
                  name: 'encryption',
                  value: true,
                }],
              }],
            },
            {
              type: 'input',
              name: 'encryption_key_location',
              placeholder: helptext.encryption_key_location_placeholder,
              tooltip: helptext.encryption_key_location_tooltip,
              relation: [{
                action: RelationAction.Show,
                connective: RelationConnection.And,
                when: [{
                  name: 'encryption',
                  value: true,
                }, {
                  name: 'encryption_key_location_truenasdb',
                  value: false,
                }],
              }],
            },
          ],
        },
        {
          name: 'general',
          label: false,
          class: 'general',
          width: '100%',
          config: [
            {
              type: 'radio',
              name: 'transport',
              placeholder: helptext.transport_placeholder,
              tooltip: helptext.transport_tooltip,
              options: [
                {
                  label: this.translate.instant('Encryption (more secure, but slower)'),
                  value: TransportMode.Ssh,
                },
                {
                  label: this.translate.instant('No Encryption (less secure, but faster)'),
                  value: TransportMode.Netcat,
                },
              ],
              value: TransportMode.Ssh,
              relation: [{
                action: RelationAction.Show,
                connective: RelationConnection.Or,
                when: [{
                  name: 'source_datasets_from',
                  value: DatasetSource.Remote,
                }, {
                  name: 'target_dataset_from',
                  value: DatasetSource.Remote,
                }],
              }],
            },
            {
              type: 'input',
              name: 'name',
              placeholder: helptext.name_placeholder,
              tooltip: helptext.name_tooltip,
              required: true,
              validation: [Validators.required, forbiddenValues(this.namesInUse)],
            },
          ],
        },
      ],
      fieldConfig: [],
    },
    {
      label: helptext.step2_label,
      fieldConfig: [
        {
          type: 'radio',
          name: 'schedule_method',
          placeholder: helptext.schedule_method_placeholder,
          tooltip: helptext.schedule_method_tooltip,
          options: [{
            label: this.translate.instant('Run On a Schedule'),
            value: ScheduleMethod.Cron,
          }, {
            label: this.translate.instant('Run Once'),
            value: ScheduleMethod.Once,
          }],
          value: ScheduleMethod.Cron,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'scheduler',
          name: 'schedule_picker',
          placeholder: helptext.schedule_placeholder,
          tooltip: helptext.schedule_tooltip,
          value: CronPresetValue.Daily,
          class: 'inline',
          width: '50%',
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'schedule_method',
              value: ScheduleMethod.Cron,
            }],
          }],
          required: true,
          validation: [Validators.required],
        },
        {
          type: 'checkbox',
          name: 'readonly',
          placeholder: helptext.readonly_placeholder,
          tooltip: helptext.readonly_tooltip,
          relation: [{
            action: RelationAction.Show,
            when: [{
              name: 'schedule_method',
              value: ScheduleMethod.Once,
            }],
          }],
          value: true,
        },
        {
          type: 'radio',
          name: 'retention_policy',
          placeholder: helptext.retention_policy_placeholder,
          tooltip: helptext.retention_policy_tooltip,
          options: [{
            label: this.translate.instant('Same as Source'),
            value: RetentionPolicy.Source,
          }, {
            label: this.translate.instant('Never Delete'),
            value: RetentionPolicy.None,
          }, {
            label: this.translate.instant('Custom'),
            value: RetentionPolicy.Custom,
          }],
          value: RetentionPolicy.Source,
          class: 'inline',
          width: '50%',
        },
        {
          placeholder: '',
          type: 'input',
          name: 'lifetime_value',
          inputType: 'number',
          value: 2,
          required: true,
          validation: [Validators.required, Validators.min(0)],
          class: 'inline',
          width: '25%',
          relation: [{
            action: RelationAction.Show,
            connective: RelationConnection.Or,
            when: [{
              name: 'retention_policy',
              value: RetentionPolicy.Custom,
            }],
          }],
        },
        {
          type: 'select',
          name: 'lifetime_unit',
          tooltip: '',
          options: [{
            label: this.translate.instant('Hours'),
            value: LifetimeUnit.Hour,
          }, {
            label: this.translate.instant('Days'),
            value: LifetimeUnit.Day,
          }, {
            label: this.translate.instant('Weeks'),
            value: LifetimeUnit.Week,
          }, {
            label: this.translate.instant('Months'),
            value: LifetimeUnit.Month,
          }, {
            label: this.translate.instant('Years'),
            value: LifetimeUnit.Year,
          }],
          value: LifetimeUnit.Week,
          class: 'inline',
          width: '25%',
          relation: [{
            action: RelationAction.Show,
            connective: RelationConnection.Or,
            when: [{
              name: 'retention_policy',
              value: RetentionPolicy.Custom,
            }],
          }],
          required: true,
          validation: [Validators.required],
        },
      ],
    },
  ];

  protected dialogFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'name',
      placeholder: sshConnectionsHelptex.name_placeholder,
      tooltip: sshConnectionsHelptex.name_tooltip,
      required: true,
      validation: [Validators.required],
    },
    {
      type: 'select',
      name: 'setup_method',
      placeholder: sshConnectionsHelptex.setup_method_placeholder,
      tooltip: sshConnectionsHelptex.setup_method_tooltip,
      options: [
        {
          label: this.translate.instant('Manual'),
          value: 'manual',
        }, {
          label: this.translate.instant('Semi-automatic (TrueNAS CORE only)'),
          value: 'semiautomatic',
        },
      ],
      value: 'semiautomatic',
      isHidden: false,
    },
    {
      type: 'input',
      name: 'host',
      placeholder: sshConnectionsHelptex.host_placeholder,
      tooltip: sshConnectionsHelptex.host_tooltip,
      required: true,
      validation: [Validators.required],
      relation: [{
        action: RelationAction.Show,
        when: [{
          name: 'setup_method',
          value: 'manual',
        }],
      }],
    }, {
      type: 'input',
      inputType: 'number',
      name: 'port',
      placeholder: sshConnectionsHelptex.port_placeholder,
      tooltip: sshConnectionsHelptex.port_tooltip,
      value: 22,
      relation: [{
        action: RelationAction.Show,
        when: [{
          name: 'setup_method',
          value: 'manual',
        }],
      }],
    }, {
      type: 'input',
      name: 'url',
      placeholder: sshConnectionsHelptex.url_placeholder,
      tooltip: sshConnectionsHelptex.url_tooltip,
      required: true,
      validation: [Validators.required],
      relation: [{
        action: RelationAction.Show,
        when: [{
          name: 'setup_method',
          value: 'semiautomatic',
        }],
      }],
    }, {
      type: 'input',
      name: 'username',
      placeholder: sshConnectionsHelptex.username_placeholder,
      tooltip: sshConnectionsHelptex.username_tooltip,
      value: 'root',
      required: true,
      validation: [Validators.required],
    }, {
      type: 'input',
      inputType: 'password',
      name: 'password',
      placeholder: sshConnectionsHelptex.password_placeholder,
      tooltip: sshConnectionsHelptex.password_tooltip,
      togglePw: true,
      required: true,
      validation: [Validators.required],
      relation: [{
        action: RelationAction.Show,
        when: [{
          name: 'setup_method',
          value: 'semiautomatic',
        }],
      }],
    }, {
      type: 'input',
      name: 'otp_token',
      placeholder: sshConnectionsHelptex.otp_placeholder,
      tooltip: sshConnectionsHelptex.otp_tooltip,
      relation: [{
        action: RelationAction.Show,
        when: [{
          name: 'setup_method',
          value: 'semiautomatic',
        }],
      }],
    }, {
      type: 'select',
      name: 'private_key',
      placeholder: sshConnectionsHelptex.private_key_placeholder,
      tooltip: sshConnectionsHelptex.private_key_tooltip,
      options: [
        {
          label: this.translate.instant('Generate New'),
          value: 'NEW',
        },
      ],
      required: true,
      validation: [Validators.required],
    }, {
      type: 'input',
      name: 'remote_host_key',
      isHidden: true,
    }, {
      type: 'select',
      name: 'cipher',
      placeholder: helptext.cipher_placeholder,
      tooltip: '',
      options: [
        {
          label: this.translate.instant('Standard (Secure)'),
          value: CipherType.Standard,
        }, {
          label: this.translate.instant('Fast (Less secure)'),
          value: CipherType.Fast,
        }, {
          label: this.translate.instant('Disabled (Not encrypted)'),
          value: CipherType.Disabled,
        },
      ],
      value: CipherType.Standard,
    },
  ];
  protected selectedReplicationTask: ReplicationTask;
  protected semiSshFieldGroup = [
    'url',
    'password',
  ] as const;

  protected createCalls = {
    private_key: 'keychaincredential.create',
    ssh_credentials_semiautomatic: 'keychaincredential.remote_ssh_semiautomatic_setup',
    ssh_credentials_manual: 'keychaincredential.create',
    periodic_snapshot_tasks: 'pool.snapshottask.create',
    replication: 'replication.create',
    snapshot: 'zfs.snapshot.create',
  } as const;

  protected deleteCalls = {
    private_key: 'keychaincredential.delete',
    ssh_credentials: 'keychaincredential.delete',
    periodic_snapshot_tasks: 'pool.snapshottask.delete',
    replication: 'replication.delete',
  } as const;

  protected snapshotsCountField: FormParagraphConfig;
  private existSnapshotTasks: number[] = [];
  private eligibleSnapshots = 0;
  protected preloadFieldSet: FieldSet;
  protected sourceFieldSet: FieldSet;
  protected targetFieldSet: FieldSet;

  constructor(
    private keychainCredentialService: KeychainCredentialService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private replicationService: ReplicationService,
    private datePipe: DatePipe,
    private entityFormService: EntityFormService,
    private modalService: ModalService,
    private translate: TranslateService,
  ) {
    this.ws.call('replication.query').pipe(untilDestroyed(this)).subscribe((replications) => {
      this.namesInUse.push(...replications.map((replication) => replication.name));
    });
    this.modalService.getRow$.pipe(
      take(1),
      untilDestroyed(this),
    ).subscribe((rowId: number) => {
      this.pk = rowId;
    });
  }

  isCustomActionVisible(actionId: string, stepperIndex: number): boolean {
    if (stepperIndex === 0) {
      return true;
    }
    return false;
  }

  afterInit(entityWizard: EntityWizardComponent): void {
    this.entityWizard = entityWizard;
    this.preloadFieldSet = _.find(this.wizardConfig[0].fieldSets, { class: 'preload' });
    this.sourceFieldSet = _.find(this.wizardConfig[0].fieldSets, { class: 'source' });
    this.targetFieldSet = _.find(this.wizardConfig[0].fieldSets, { class: 'target' });
    this.snapshotsCountField = _.find(this.sourceFieldSet.config, { name: 'snapshots_count' }) as FormParagraphConfig;

    this.step0Init();
    this.step1Init();
    this.toggleNamingSchemaOrRegex();
  }

  step0Init(): void {
    const existReplicationField = _.find(this.preloadFieldSet.config, { name: 'exist_replication' }) as FormSelectConfig;
    this.replicationService.getReplicationTasks().pipe(untilDestroyed(this)).subscribe(
      (tasks: ReplicationTask[]) => {
        for (const task of tasks) {
          if (task.transport !== TransportMode.Legacy) {
            // TODO: Change to icu message format.
            const label = task.name + ' (' + ((task.state && task.state.datetime)
              ? 'last run ' + this.datePipe.transform(new Date(task.state.datetime.$date), 'MM/dd/yyyy')
              : 'never ran')
            + ')';
            existReplicationField.options.push({ label, value: task });
            if (this.pk === task.id) {
              this.loadOrClearReplicationTask(task);
            }
          }
        }
      },
    );

    const privateKeyField = _.find(this.dialogFieldConfig, { name: 'private_key' }) as FormSelectConfig;
    this.keychainCredentialService.getSshKeys().pipe(untilDestroyed(this)).subscribe((keyPairs) => {
      const keypairOptions = keyPairs.map((keypair) => ({
        label: keypair.name,
        value: String(keypair.id),
      }));
      privateKeyField.options = privateKeyField.options.concat(keypairOptions);
    });

    const sshCredentialsSourceField = _.find(this.sourceFieldSet.config, { name: 'ssh_credentials_source' }) as FormSelectConfig;
    const sshCredentialsTargetField = _.find(this.targetFieldSet.config, { name: 'ssh_credentials_target' }) as FormSelectConfig;
    this.keychainCredentialService.getSshConnections().pipe(untilDestroyed(this)).subscribe((connections) => {
      connections.forEach((connection) => {
        sshCredentialsSourceField.options.push({ label: connection.name, value: connection.id });
        sshCredentialsTargetField.options.push({ label: connection.name, value: connection.id });
      });
      sshCredentialsSourceField.options.push({ label: this.translate.instant('Create New'), value: 'NEW' });
      sshCredentialsTargetField.options.push({ label: this.translate.instant('Create New'), value: 'NEW' });
    });

    this.entityWizard.formArray.get([0]).get('exist_replication').valueChanges.pipe(untilDestroyed(this)).subscribe((value: ReplicationTask) => {
      if (value !== null) {
        this.loadOrClearReplicationTask(value);
      }
    });
    this.entityWizard.formArray.get([0]).get('schema_or_regex').valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.toggleNamingSchemaOrRegex();
    });
    this.entityWizard.formArray.get([0]).get('source_datasets').valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.genTaskName();
      this.getSnapshots();
    });
    this.entityWizard.formArray.get([0]).get('target_dataset').valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.genTaskName();
    });

    for (const destination of ['source', 'target']) {
      const credentialName = 'ssh_credentials_' + destination;
      const datasetName = destination === 'source' ? 'source_datasets' : 'target_dataset';
      const datasetFrom = datasetName + '_from';
      this.entityWizard.formArray.get([0]).get(datasetFrom).valueChanges
        .pipe(untilDestroyed(this))
        .subscribe((value: DatasetSource) => {
          this.toggleNamingSchemaOrRegex();
          if (value === DatasetSource.Remote) {
            if (datasetFrom === 'source_datasets_from') {
              this.entityWizard.formArray.get([0]).get('target_dataset_from').setValue(DatasetSource.Local);
              this.setDisable('target_dataset_from', true, false, 0);
            }
            const disabled = !this.entityWizard.formArray.get([0]).get(credentialName).value;
            this.setDisable(datasetName, disabled, false, 0);
          } else {
            if (datasetFrom === 'source_datasets_from' && this.entityWizard.formArray.get([0]).get('target_dataset_from').disabled) {
              this.setDisable('target_dataset_from', false, false, 0);
            }
            this.setDisable(datasetName, false, false, 0);
          }
          const direction = value === DatasetSource.Remote ? Direction.Pull : Direction.Push;
          _.find(this.wizardConfig[0].fieldConfig, { name: 'schema_or_regex' }).placeholder = helptext[
            (direction === Direction.Pull ? 'name_schema_or_regex_placeholder_pull' : 'name_schema_or_regex_placeholder_push')
          ];
        });

      this.entityWizard.formArray.get([0]).get(credentialName).valueChanges
        .pipe(untilDestroyed(this))
        .subscribe((value: string) => {
          if (value === 'NEW' && this.entityWizard.formArray.get([0]).get(datasetFrom).value === DatasetSource.Remote) {
            this.createSshConnection(credentialName);
            this.setDisable(datasetName, false, false, 0);
          } else {
            const fieldConfig = destination === 'source' ? this.sourceFieldSet.config : this.targetFieldSet.config;
            const explorerConfig = _.find(
              fieldConfig,
              { name: datasetName },
            ) as FormExplorerConfig;
            const explorerComponent = explorerConfig.customTemplateStringOptions.explorerComponent;
            if (explorerComponent) {
              explorerComponent.nodes = [{
                mountpoint: explorerComponent.config.initial,
                name: explorerComponent.config.initial,
                hasChildren: true,
              }];
              this.entityWizard.formArray.get([0]).get(datasetName).setValue('');
            }
            this.setDisable(datasetName, false, false, 0);
          }
        });
    }

    this.entityWizard.formArray.get([0]).get('recursive').valueChanges.pipe(untilDestroyed(this)).subscribe((value: boolean) => {
      const explorerConfig = _.find(this.sourceFieldSet.config, { name: 'source_datasets' }) as FormExplorerConfig;
      const explorerComponent = explorerConfig.customTemplateStringOptions;
      if (explorerComponent) {
        explorerComponent.useTriState = value;
      }
    });

    this.entityWizard.formArray.get([0]).get('custom_snapshots').valueChanges.pipe(untilDestroyed(this)).subscribe((value: boolean) => {
      this.toggleNamingSchemaOrRegex();
      if (!value) {
        this.getSnapshots();
      }
    });
  }

  loadOrClearReplicationTask(task: ReplicationTask): void {
    if (task !== undefined) {
      this.loadReplicationTask(task);
    } else if (this.selectedReplicationTask !== undefined) {
      this.clearReplicationTask();
    }
    this.selectedReplicationTask = task;
  }

  setSchemaOrRegexForObject(
    data: any,
    schemaOrRegex: SnapshotNamingOption,
    schema: string = null,
    regex: string = null,
  ): any {
    if (schemaOrRegex === SnapshotNamingOption.NamingSchema) {
      data.naming_schema = schema ? [schema] : [this.defaultNamingSchema];
      delete data.name_regex;
    } else {
      data.name_regex = regex;
      delete data.naming_schema;
      delete data.also_include_naming_schema;
    }
    return data;
  }

  step1Init(): void {
    this.entityWizard.formArray.get([1]).get('retention_policy').valueChanges.pipe(untilDestroyed(this)).subscribe((value: RetentionPolicy) => {
      const disable = value === RetentionPolicy.Source;
      if (disable) {
        this.entityWizard.formArray.get([1]).get('lifetime_value').disable();
        this.entityWizard.formArray.get([1]).get('lifetime_unit').disable();
      } else {
        this.entityWizard.formArray.get([1]).get('lifetime_value').enable();
        this.entityWizard.formArray.get([1]).get('lifetime_unit').enable();
      }
    });
  }

  getSourceChildren(node: TreeNode): Promise<ListdirChild[] | void> {
    const fromLocal = this.entityWizard.formArray.get([0]).get('source_datasets_from').value === DatasetSource.Local;
    const sshCredentials = this.entityWizard.formArray.get([0]).get('ssh_credentials_source').value;

    if (fromLocal) {
      return new Promise((resolve) => {
        resolve(this.entityFormService.getPoolDatasets());
      });
    }
    if (sshCredentials === 'NEW') {
      return new Promise((resolve) => {
        this.entityWizard.formArray.get([0]).get('ssh_credentials_source').setErrors({});
        resolve();
      });
    }
    return new Promise((resolve) => {
      this.replicationService.getRemoteDataset(TransportMode.Ssh, sshCredentials, this).then(
        (res) => {
          const sourceDatasetsFormControl = this.entityWizard.formArray.get([0]).get('source_datasets');
          const prevErrors = sourceDatasetsFormControl.errors;
          delete prevErrors.failedToLoadChildren;
          if (Object.keys(prevErrors).length) {
            sourceDatasetsFormControl.setErrors({ ...prevErrors });
          } else {
            sourceDatasetsFormControl.setErrors(null);
          }
          const sourceDatasetsFieldConfig = _.find(this.wizardConfig[0].fieldConfig, { name: 'source_datasets' });
          sourceDatasetsFieldConfig.warnings = null;

          resolve(res);
        },
        () => {
          node.collapse();
          const sourceDatasetsFormControl = this.entityWizard.formArray.get([0]).get('source_datasets');
          const prevErrors = sourceDatasetsFormControl.errors;
          sourceDatasetsFormControl.setErrors({
            ...prevErrors,
            failedToLoadChildren: true,
          });
          const sourceDatasetsFieldConfig = _.find(this.wizardConfig[0].fieldConfig, { name: 'source_datasets' });
          sourceDatasetsFieldConfig.warnings = this.translate.instant('Failed to load datasets');
        },
      );
    });
  }

  getTargetChildren(node: TreeNode): Promise<ListdirChild[] | void> {
    const fromLocal = this.entityWizard.formArray.get([0]).get('target_dataset_from').value === DatasetSource.Local;
    const sshCredentials = this.entityWizard.formArray.get([0]).get('ssh_credentials_target').value;
    if (fromLocal) {
      return new Promise((resolve) => {
        resolve(this.entityFormService.getPoolDatasets());
      });
    }
    if (sshCredentials === 'NEW') {
      return new Promise((resolve) => {
        this.entityWizard.formArray.get([0]).get('ssh_credentials_target').setErrors({});
        resolve();
      });
    }
    return new Promise((resolve) => {
      this.replicationService.getRemoteDataset(TransportMode.Ssh, sshCredentials, this).then(
        (res) => {
          const targetDatasetFormControl = this.entityWizard.formArray.get([0]).get('target_dataset');
          const prevErrors = targetDatasetFormControl.errors;
          delete prevErrors.failedToLoadChildren;
          if (Object.keys(prevErrors).length) {
            targetDatasetFormControl.setErrors({ ...prevErrors });
          } else {
            targetDatasetFormControl.setErrors(null);
          }
          const targetDatasetFieldConfig = _.find(this.wizardConfig[0].fieldConfig, { name: 'target_dataset' });
          targetDatasetFieldConfig.warnings = null;

          resolve(res);
        },
        () => {
          node.collapse();
          const targetDatasetFormControl = this.entityWizard.formArray.get([0]).get('target_dataset');
          const prevErrors = targetDatasetFormControl.errors;
          targetDatasetFormControl.setErrors({
            ...prevErrors,
            failedToLoadChildren: true,
          });
          const targetDatasetFieldConfig = _.find(this.wizardConfig[0].fieldConfig, { name: 'target_dataset' });
          targetDatasetFieldConfig.warnings = this.translate.instant('Failed to load datasets');
        },
      );
    });
  }

  setDisable(field: string, disabled: boolean, isHidden: boolean, stepIndex: number): void {
    const control: FieldConfig = _.find(this.wizardConfig[stepIndex].fieldConfig, { name: field });
    control['isHidden'] = isHidden;
    control.disabled = disabled;
    if (disabled) {
      this.entityWizard.formArray.get([stepIndex]).get(field).disable();
    } else {
      this.entityWizard.formArray.get([stepIndex]).get(field).enable();
    }
  }

  loadReplicationTask(task: any): void {
    // TODO: Update logic to use ReplicationTask as a type
    // Add something similar to resourceTransformIncomingRestData for EntityWizard
    // 'task.periodic_snapshot_tasks' should be type of number[] currently PeriodicSnapshotTask[]
    // 'task.ssh_credentials' should be type of number[], currently SshCredentials[]
    if (task.direction === Direction.Push) {
      task['source_datasets_from'] = DatasetSource.Local;
      task['target_dataset_from'] = task.ssh_credentials ? DatasetSource.Remote : DatasetSource.Local;
      if (task.ssh_credentials) {
        task['ssh_credentials_target'] = task.ssh_credentials.id;
      }
    } else {
      task['source_datasets_from'] = DatasetSource.Remote;
      task['target_dataset_from'] = DatasetSource.Local;
      task['ssh_credentials_source'] = task.ssh_credentials.id;
    }

    const controls = [
      'source_datasets_from',
      'target_dataset_from',
      'ssh_credentials_source',
      'ssh_credentials_target',
      'transport',
      'source_datasets',
      'target_dataset',
    ];
    for (const controlName of controls) {
      const ctrl = this.entityWizard.formArray.get([0]).get(controlName);
      if (ctrl && !ctrl.disabled) {
        ctrl.setValue(task[controlName]);
      }
    }

    if (task.schedule || task.periodic_snapshot_tasks.length > 0) {
      const taskData = task.periodic_snapshot_tasks[0] || task;
      task['schedule_method'] = ScheduleMethod.Cron;
      task['schedule_picker'] = taskData.schedule ? `${taskData.schedule.minute} ${taskData.schedule.hour} ${taskData.schedule.dom} ${taskData.schedule.month} ${taskData.schedule.dow}` : null;

      if (taskData['lifetime_value'] === null && taskData['lifetime_unit'] === null) {
        task['retention_policy'] = RetentionPolicy.None;
      } else {
        task['lifetime_value'] = taskData['lifetime_value'];
        task['lifetime_unit'] = taskData['lifetime_unit'];
        task['retention_policy'] = task.schedule !== null ? RetentionPolicy.Custom : RetentionPolicy.Source;
      }
    } else {
      task['schedule_method'] = ScheduleMethod.Once;
    }
    // periodic_snapshot_tasks
    for (const i of ['schedule_method', 'schedule_picker', 'retention_policy', 'lifetime_value', 'lifetime_unit']) {
      const ctrl = this.entityWizard.formArray.get([1]).get(i);
      if (ctrl && !ctrl.disabled) {
        ctrl.setValue(task[i]);
      }
    }
  }

  clearReplicationTask(): void {
    this.entityWizard.formArray.reset();
    for (let i = 0; i < (this.entityWizard.formArray as UntypedFormArray).length; i++) {
      for (const item in (this.entityWizard.formArray.get([i]) as UntypedFormGroup).controls) {
        const itemConf = _.find(this.wizardConfig[i].fieldConfig, { name: item });
        if (itemConf.value !== undefined && item !== 'exist_replication') {
          this.entityWizard.formArray.get([i]).get(item).setValue(itemConf.value);
        }
      }
    }
  }

  parsePickerTime(picker: string): Schedule {
    const spl = picker.split(' ');
    return {
      minute: spl[0],
      hour: spl[1],
      dom: spl[2],
      month: spl[3],
      dow: spl[4],
    };
  }

  async doCreate(
    data: any, item: keyof CreatedItems,
  ): Promise<KeychainCredential | KeychainSshCredentials | PeriodicSnapshotTask[] | ReplicationTask | ZfsSnapshot[]> {
    if (item === 'private_key') {
      const payload = {
        name: data['name'] + ' Key',
        type: KeychainCredentialType.SshKeyPair,
        attributes: data['sshkeypair'],
      };
      return lastValueFrom(this.ws.call(this.createCalls[item], [payload]));
    }

    if (item === 'ssh_credentials') {
      let payload: SshSemiAutomaticSetup | KeychainCredentialCreate;
      const sshCreateItem = ('_' + data['setup_method']) as 'ssh_credentials_semiautomatic' | 'ssh_credentials_manual';
      if (data['setup_method'] === 'manual') {
        payload = {
          name: data['name'],
          type: KeychainCredentialType.SshCredentials,
          attributes: {
            cipher: data['cipher'],
            host: data['host'],
            port: data['port'],
            private_key: data['private_key'],
            remote_host_key: data['remote_host_key'],
            username: data['username'],
          },
        } as KeychainCredentialCreate;
        return this.ws.call(this.createCalls[sshCreateItem], [payload]).toPromise();
      }

      payload = {
        name: data['name'],
        private_key: data['private_key'],
        cipher: data['cipher'],
      } as SshSemiAutomaticSetup;
      for (const i of this.semiSshFieldGroup) {
        payload[i] = data[i];
      }
      return lastValueFrom(this.ws.call(this.createCalls[sshCreateItem], [payload]));
    }

    if (item === 'periodic_snapshot_tasks') {
      let payload: PeriodicSnapshotTaskCreate;
      this.existSnapshotTasks = [];
      const snapshotPromises: Promise<PeriodicSnapshotTask>[] = [];
      for (const dataset of data['source_datasets']) {
        payload = {
          dataset,
          recursive: data['recursive'],
          schedule: this.parsePickerTime(data['schedule_picker']),
          lifetime_value: 2,
          lifetime_unit: LifetimeUnit.Week,
          naming_schema: data['naming_schema'] ? data['naming_schema'] : this.defaultNamingSchema,
          enabled: true,
        };
        await this.isSnapshotTaskExist(payload).then((tasks) => {
          if (tasks.length === 0) {
            snapshotPromises.push(
              lastValueFrom(this.ws.call(this.createCalls[item], [payload])),
            );
          } else {
            this.existSnapshotTasks.push(...tasks.map((task) => task.id));
          }
        });
      }
      return Promise.all(snapshotPromises);
    }

    if (item === 'snapshot') {
      const snapshotPromises = [];
      for (const dataset of data['source_datasets']) {
        const payload = {
          dataset,
          naming_schema: data['naming_schema'] ? data['naming_schema'] : this.defaultNamingSchema,
          recursive: data['recursive'] ? data['recursive'] : false,
        };
        snapshotPromises.push(
          lastValueFrom(this.ws.call(this.createCalls[item], [payload])),
        );
      }
      return Promise.all(snapshotPromises);
    }

    if (item === 'replication') {
      let payload = {
        name: data['name'],
        direction: data['source_datasets_from'] === DatasetSource.Remote ? Direction.Pull : Direction.Push,
        source_datasets: data['source_datasets'],
        target_dataset: data['target_dataset'],
        ssh_credentials: data['ssh_credentials_source'] || data['ssh_credentials_target'],
        transport: data['transport'] ? data['transport'] : TransportMode.Local,
        retention_policy: data['retention_policy'],
        recursive: data['recursive'],
        encryption: data['encryption'],
      } as ReplicationCreate;
      if (payload.encryption) {
        payload['encryption_key_format'] = data['encryption_key_format'];
        if (data['encryption_key_format'] === EncryptionKeyFormat.Passphrase) {
          payload['encryption_key'] = data['encryption_key_passphrase'];
        } else {
          payload['encryption_key'] = data['encryption_key_generate']
            ? this.replicationService.generateEncryptionHexKey(64)
            : data['encryption_key_hex'];
        }

        payload['encryption_key_location'] = data['encryption_key_location_truenasdb'] ? '$TrueNAS' : data['encryption_key_location'];
      }

      // schedule option
      if (data['schedule_method'] === ScheduleMethod.Cron) {
        payload['auto'] = true;
        if (payload['direction'] === Direction.Pull) {
          payload['schedule'] = this.parsePickerTime(data['schedule_picker']);
          payload = this.setSchemaOrRegexForObject(payload, data['schema_or_regex'], data['naming_schema'], data['name_regex']);
        } else {
          payload['periodic_snapshot_tasks'] = data['periodic_snapshot_tasks'];
        }
      } else {
        payload['auto'] = false;
        if (payload['direction'] === Direction.Pull) {
          payload = this.setSchemaOrRegexForObject(payload, data['schema_or_regex'], data['naming_schema'], data['name_regex']);
        } else if (data['schema_or_regex'] === SnapshotNamingOption.NamingSchema) {
          payload['also_include_naming_schema'] = data['naming_schema'] ? [data['naming_schema']] : [this.defaultNamingSchema];
        } else {
          payload.name_regex = data['name_regex'];
        }
      }

      if (data['retention_policy'] === RetentionPolicy.Custom) {
        payload['lifetime_value'] = data['lifetime_value'];
        payload['lifetime_unit'] = data['lifetime_unit'];
      }

      if (payload['transport'] === TransportMode.Netcat) {
        payload['netcat_active_side'] = NetcatMode.Remote; // default?
      }

      payload['readonly'] = data['schedule_method'] === ScheduleMethod.Cron || data['readonly']
        ? ReadOnlyMode.Set
        : ReadOnlyMode.Ignore;

      return this.ws.call('replication.target_unmatched_snapshots', [
        payload['direction'],
        payload['source_datasets'],
        payload['target_dataset'],
        payload['transport'],
        payload['ssh_credentials'],
      ]).toPromise().then(
        (res) => {
          let hasBadSnapshots = false;
          for (const ds in res) {
            if (res[ds].length > 0) {
              hasBadSnapshots = true;
              break;
            }
          }
          if (hasBadSnapshots) {
            return this.dialogService.confirm({
              title: helptext.clearSnapshotDialog_title,
              message: helptext.clearSnapshotDialog_content,
            }).toPromise().then(
              (dialogResult) => {
                payload['allow_from_scratch'] = dialogResult;
                return this.ws.call(this.createCalls[item], [payload]).toPromise();
              },
            );
          }
          return this.ws.call(this.createCalls[item], [payload]).toPromise();
        },
        () => {
          // show error ?
          this.ws.call(this.createCalls[item], [payload]).toPromise();
        },
      ) as Promise<ReplicationTask>;
    }
  }

  async customSubmit(value: any): Promise<void> {
    if (typeof (value.source_datasets) === 'string') {
      value.source_datasets = _.filter(value.source_datasets.split(',').map(_.trim));
    }
    this.loader.open();
    let toStop = false;

    const createdItems: CreatedItems = {
      periodic_snapshot_tasks: null,
      snapshot: null,
      replication: null,
    };

    for (const createdItem in createdItems) {
      const item = createdItem as 'periodic_snapshot_tasks' | 'snapshot' | 'replication';
      if (!toStop) {
        if (!(item === 'periodic_snapshot_tasks' && (value['schedule_method'] !== ScheduleMethod.Cron || value['source_datasets_from'] !== DatasetSource.Local))
                && !(item === 'snapshot' && (this.eligibleSnapshots > 0 || value['source_datasets_from'] !== DatasetSource.Local))) {
          await this.doCreate(value, item).then(
            (res: PeriodicSnapshotTask[] | ReplicationTask | ZfsSnapshot[]) => {
              if (item === 'snapshot') {
                createdItems[item] = res as ZfsSnapshot[];
              } else {
                value[item] = ('id' in res && res.id)
                  || (res as PeriodicSnapshotTask[]).map((snapshot: { id: number }) => snapshot.id);
                if (item === 'periodic_snapshot_tasks' && this.existSnapshotTasks.length !== 0) {
                  value[item].push(...this.existSnapshotTasks);
                }
                if ('id' in res && res.id) {
                  createdItems[item as 'replication'] = res.id;
                } else {
                  createdItems[item as 'periodic_snapshot_tasks'] = (res as PeriodicSnapshotTask[])
                    .map((snapshot: { id: number }) => snapshot.id);
                }
              }
            },
            (err) => {
              new EntityUtils().handleWsError(this, err, this.dialogService);
              toStop = true;
              this.rollBack(createdItems);
            },
          );
        }
      }
    }

    if (value['schedule_method'] === ScheduleMethod.Once && createdItems['replication'] !== undefined) {
      await this.ws.call('replication.run', [createdItems['replication']]).toPromise().then(
        () => {
          this.dialogService.info(
            this.translate.instant('Task started'),
            this.translate.instant('Replication <i>{name}</i> has started.', { name: value['name'] }),
            true,
          );
        },
      );
    }

    this.loader.close();
    if (!toStop) {
      this.modalService.closeSlideIn();
    }
  }

  async rollBack(items: CreatedItems): Promise<void> {
    const keys = Object.keys(items).reverse();
    for (const createdItemKey of keys) {
      const key = createdItemKey as keyof CreatedItems;
      if (key === 'periodic_snapshot_tasks') {
        if (!items[key]?.length) {
          continue;
        }
        for (const task of items[key]) {
          await this.ws.call('pool.snapshottask.delete', [task]).toPromise();
        }

        continue;
      }

      if (key === 'snapshot') {
        continue;
      }

      if (items[key] !== null && items[key] !== undefined) {
        const deleteMethod = this.deleteCalls[key];
        await this.ws.call(deleteMethod, [items[key]]).toPromise().then(
          () => {},
        );
      }
    }
  }

  createSshConnection(activatedField: string): void {
    const conf: DialogFormConfiguration = {
      title: this.translate.instant('Create SSH Connection'),
      fieldConfig: this.dialogFieldConfig,
      saveButtonText: this.translate.instant('Create SSH Connection'),
      customSubmit: async (entityDialog: EntityDialogComponent) => {
        const value = entityDialog.formValue;
        let prerequisite = true;
        this.entityWizard.loader.open();

        if (value['private_key'] === 'NEW') {
          await this.replicationService.genSshKeypair().then(
            (keyPair) => {
              value['sshkeypair'] = keyPair;
            },
            (err) => {
              prerequisite = false;
              new EntityUtils().handleWsError(this, err, this.dialogService);
            },
          );
        }
        if (value['setup_method'] === 'manual') {
          await this.getRemoteHostKey(value).then(
            (res) => {
              value['remote_host_key'] = res;
            },
            (err) => {
              prerequisite = false;
              new EntityUtils().handleWsError(this, err, this.dialogService);
            },
          );
        }

        if (!prerequisite) {
          this.entityWizard.loader.close();
          return;
        }
        const createdItems: CreatedItems = {
          private_key: null,
          ssh_credentials: null,
        };
        let hasError = false;
        for (const createdItem in createdItems) {
          const item = createdItem as 'private_key' | 'ssh_credentials';
          if (!((item === 'private_key' && value['private_key'] !== 'NEW'))) {
            await this.doCreate(value, item).then(
              (res: KeychainCredential | KeychainSshCredentials) => {
                value[item] = res.id;
                createdItems[item] = res.id;
                if (item === 'private_key') {
                  const privateKeyField = _.find(this.dialogFieldConfig, { name: 'private_key' }) as FormSelectConfig;
                  privateKeyField.options.push({ label: res.name + ' (New Created)', value: res.id });
                }
                if (item === 'ssh_credentials') {
                  const sshCredentialsSourceField = _.find(this.wizardConfig[0].fieldConfig, { name: 'ssh_credentials_source' }) as FormSelectConfig;
                  const sshCredentialsTargetField = _.find(this.wizardConfig[0].fieldConfig, { name: 'ssh_credentials_target' }) as FormSelectConfig;
                  sshCredentialsSourceField.options.push({ label: res.name + ' (New Created)', value: res.id });
                  sshCredentialsTargetField.options.push({ label: res.name + ' (New Created)', value: res.id });
                  this.entityWizard.formArray.get([0]).get([activatedField]).setValue(res.id);
                }
              },
              (err) => {
                hasError = true;
                this.rollBack(createdItems);
                new EntityUtils().handleWsError(this, err, this.dialogService, this.dialogFieldConfig);
              },
            );
          }
        }
        this.entityWizard.loader.close();
        if (!hasError) {
          entityDialog.dialogRef.close(true);
        }
      },
    };
    this.dialogService.dialogForm(conf, true);
  }

  getRemoteHostKey(value: { host: string; port: number }): Promise<string> {
    const payload = {
      host: value['host'],
      port: value['port'],
    };
    return lastValueFrom(this.ws.call('keychaincredential.remote_ssh_host_key_scan', [payload]));
  }

  genTaskName(): void {
    const source = this.entityWizard.formArray.get([0]).get('source_datasets').value || [];
    const target = this.entityWizard.formArray.get([0]).get('target_dataset').value;
    let suggestName = '';
    if (source.length > 3) {
      suggestName = source[0] + ',...,' + source[source.length - 1] + ' - ' + target;
    } else {
      suggestName = source.join(',') + ' - ' + target;
    }
    this.entityWizard.formArray.get([0]).get('name').setValue(suggestName);
  }

  getSnapshots(): void {
    let transport = this.entityWizard.formArray.get([0]).get('transport').enabled
      ? this.entityWizard.formArray.get([0]).get('transport').value
      : TransportMode.Local;
    // count local snapshots if transport is SSH/SSH-NETCAT, and direction is PUSH
    if (this.entityWizard.formArray.get([0]).get('ssh_credentials_target').value) {
      transport = TransportMode.Local;
    }
    const namingSchemaFormControl = this.entityWizard.formArray.get([0]).get('naming_schema');
    const namingSchema = namingSchemaFormControl.enabled && namingSchemaFormControl.value
      ? namingSchemaFormControl.value.split(' ') : [this.defaultNamingSchema];

    const schemaOrRegexFormControl = this.entityWizard.formArray.get([0]).get('schema_or_regex');

    const nameRegexFormControl = this.entityWizard.formArray.get([0]).get('name_regex');

    const payload: CountManualSnapshotsParams[] = [{
      datasets: this.entityWizard.formArray.get([0]).get('source_datasets').value || [],
      transport,
      ssh_credentials: transport === TransportMode.Local ? null : this.entityWizard.formArray.get([0]).get('ssh_credentials_source').value,
    }];

    if (schemaOrRegexFormControl.value === SnapshotNamingOption.NamingSchema) {
      payload[0].naming_schema = namingSchema;
    } else {
      payload[0].name_regex = nameRegexFormControl.value;
    }

    if (payload[0].datasets.length > 0) {
      this.ws.call('replication.count_eligible_manual_snapshots', [payload[0]]).pipe(untilDestroyed(this)).subscribe({
        next: (res) => {
          this.eligibleSnapshots = res.eligible;
          const isPush = this.entityWizard.formArray.get([0]).get('source_datasets_from').value === DatasetSource.Local;
          let spanClass = 'info-paragraph';
          let snapexpl = '';
          if (res.eligible === 0) {
            if (isPush) {
              snapexpl = 'Snapshots will be created automatically.';
            } else {
              spanClass = 'warning-paragraph';
            }
          }
          this.snapshotsCountField.paraText = `<span class="${spanClass}"><b>${res.eligible}</b> snapshots found. ${snapexpl}</span>`;
        },
        error: (err) => {
          this.eligibleSnapshots = 0;
          this.snapshotsCountField.paraText = '';
          new EntityUtils().handleWsError(this, err);
        },
      });
    } else {
      this.eligibleSnapshots = 0;
      this.snapshotsCountField.paraText = '';
    }
  }

  isSnapshotTaskExist(payload: {
    dataset: string;
    schedule: Schedule;
    naming_schema?: string;
  }): Promise<PeriodicSnapshotTask[]> {
    return lastValueFrom(
      this.ws.call('pool.snapshottask.query', [[
        ['dataset', '=', payload['dataset']],
        ['schedule.minute', '=', payload['schedule']['minute']],
        ['schedule.hour', '=', payload['schedule']['hour']],
        ['schedule.dom', '=', payload['schedule']['dom']],
        ['schedule.month', '=', payload['schedule']['month']],
        ['schedule.dow', '=', payload['schedule']['dow']],
        ['naming_schema', '=', payload['naming_schema'] ? payload['naming_schema'] : this.defaultNamingSchema],
      ]]),
    );
  }

  toggleNamingSchemaOrRegex(): void {
    const customSnapshotsValue = this.entityWizard.formArray.get([0]).get('custom_snapshots').value;
    const sourceDatasetsFromValue = this.entityWizard.formArray.get([0]).get('source_datasets_from').value;
    const schemaOrRegexFormControl = this.entityWizard.formArray.get([0]).get('schema_or_regex');

    if (customSnapshotsValue || sourceDatasetsFromValue === DatasetSource.Remote) {
      if (schemaOrRegexFormControl.disabled) {
        this.setDisable('schema_or_regex', false, false, 0);
      }
      if (schemaOrRegexFormControl.value === SnapshotNamingOption.NamingSchema) {
        this.setDisable('naming_schema', false, false, 0);
        this.setDisable('name_regex', true, true, 0);
      } else {
        this.setDisable('naming_schema', true, true, 0);
        this.setDisable('name_regex', false, false, 0);
      }
    } else {
      this.setDisable('naming_schema', true, true, 0);
      if (!schemaOrRegexFormControl.disabled) {
        this.setDisable('schema_or_regex', true, true, 0);
      }
      this.setDisable('name_regex', true, true, 0);
    }
  }
}
