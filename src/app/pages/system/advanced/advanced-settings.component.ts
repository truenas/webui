import { DatePipe } from '@angular/common';
import {
  AfterViewInit, Component, OnInit, TemplateRef, ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as cronParser from 'cron-parser';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { uniqBy } from 'lodash';
import { lastValueFrom } from 'rxjs';
import {
  filter, switchMap, tap,
} from 'rxjs/operators';
import { DeviceType } from 'app/enums/device-type.enum';
import { EmptyType } from 'app/enums/empty-type.enum';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { AuthSession, AuthSessionCredentialsData } from 'app/interfaces/auth-session.interface';
import { Cronjob } from 'app/interfaces/cronjob.interface';
import { Device } from 'app/interfaces/device.interface';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import { ReplicationConfig } from 'app/interfaces/replication-config.interface';
import { Tunable } from 'app/interfaces/tunable.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppTableAction, AppTableConfig } from 'app/modules/entity/table/table.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { CronjobRow } from 'app/pages/system/advanced/cron/cron-list/cronjob-row.interface';
import { InitShutdownFormComponent } from 'app/pages/system/advanced/initshutdown/init-shutdown-form/init-shutdown-form.component';
import { ReplicationSettingsComponent } from 'app/pages/system/advanced/replication-settings/replication-settings.component';
import { SedFormComponent } from 'app/pages/system/advanced/sed-form/sed-form.component';
import { StorageSettingsComponent } from 'app/pages/system/advanced/storage-settings/storage-settings.component';
import { TokenSettingsComponent } from 'app/pages/system/advanced/token-settings/token-settings.component';
import { DataCard } from 'app/pages/system/interfaces/data-card.interface';
import { TunableFormComponent } from 'app/pages/system/tunable/tunable-form/tunable-form.component';
import {
  AppLoaderService,
  DialogService,
  UserService,
  WebSocketService2,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { AppState } from 'app/store';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';
import { ConsoleFormComponent } from './console-form/console-form.component';
import { IsolatedGpuPcisFormComponent } from './isolated-gpu-pcis/isolated-gpu-pcis-form.component';
import { KernelFormComponent } from './kernel-form/kernel-form.component';
import { SyslogFormComponent } from './syslog-form/syslog-form.component';

enum AdvancedCardId {
  Console = 'console',
  Syslog = 'syslog',
  Kernel = 'kernel',
  Replication = 'replication',
  Cron = 'cron',
  InitShutdown = 'initshutdown',
  Sysctl = 'sysctl',
  Storage = 'storage',
  Gpus = 'gpus',
  Sed = 'sed',
  Sessions = 'sessions',
}

interface AuthSessionRow {
  id: string;
  current: boolean;
  username: string;
  created_at: string;
}

@UntilDestroy()
@Component({
  templateUrl: './advanced-settings.component.html',
  providers: [DatePipe, UserService],
})
export class AdvancedSettingsComponent implements OnInit, AfterViewInit {
  dataCards: DataCard<AdvancedCardId>[] = [];
  configData: AdvancedConfig;
  replicationConfig: ReplicationConfig;
  syslog: boolean;
  systemDatasetPool: string;
  isFirstTime = true;
  sedPassword = '';
  lifetimeToken = '';

  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  cronTableConf: AppTableConfig = {
    title: helptextSystemAdvanced.fieldset_cron,
    titleHref: '/system/cron',
    queryCall: 'cronjob.query',
    deleteCall: 'cronjob.delete',
    deleteMsg: {
      title: this.translate.instant('Cron Job'),
      key_props: ['user', 'command', 'description'],
    },
    getActions: (): AppTableAction<CronjobRow>[] => {
      return [
        {
          name: 'play',
          icon: 'play_arrow',
          matTooltip: this.translate.instant('Run job'),
          onClick: (row: CronjobRow): void => {
            this.dialog
              .confirm({ title: this.translate.instant('Run Now'), message: this.translate.instant('Run this job now?'), hideCheckBox: true })
              .pipe(
                filter((run) => !!run),
                switchMap(() => this.ws.call('cronjob.run', [row.id])),
              )
              .pipe(untilDestroyed(this)).subscribe({
                next: () => {
                  const message = row.enabled
                    ? this.translate.instant('This job is scheduled to run again {nextRun}.', { nextRun: row.next_run })
                    : this.translate.instant('This job will not run again until it is enabled.');
                  this.dialog.info(
                    this.translate.instant('Job {job} Completed Successfully', { job: row.description }),
                    message,
                    true,
                  );
                },
                error: (err: WebsocketError) => new EntityUtils().handleError(this, err),
              });
          },
        },
      ];
    },
    emptyEntityLarge: false,
    parent: this,
    dataSourceHelper: this.cronDataSourceHelper,
    columns: [
      { name: this.translate.instant('Users'), prop: 'user' },
      { name: this.translate.instant('Command'), prop: 'command' },
      { name: this.translate.instant('Description'), prop: 'description' },
      { name: this.translate.instant('Schedule'), prop: 'cron_schedule' },
      { name: this.translate.instant('Enabled'), prop: 'enabled' },
      { name: this.translate.instant('Next Run'), prop: 'next_run' },
    ],
    add: async () => {
      await this.showFirstTimeWarningIfNeeded();
      this.slideInService.open(CronFormComponent);
    },
    edit: async (cron: CronjobRow) => {
      await this.showFirstTimeWarningIfNeeded();

      const modal = this.slideInService.open(CronFormComponent);
      modal.setCronForEdit(cron);
    },
  };

  initShutdownTableConf: AppTableConfig = {
    title: helptextSystemAdvanced.fieldset_initshutdown,
    titleHref: '/system/initshutdown',
    queryCall: 'initshutdownscript.query',
    deleteCall: 'initshutdownscript.delete',
    deleteMsg: {
      title: this.translate.instant('Init/Shutdown Script'),
      key_props: ['type', 'command', 'script'],
    },
    parent: this,
    emptyEntityLarge: false,
    columns: [
      { name: this.translate.instant('Type'), prop: 'type' },
      { name: this.translate.instant('Command'), prop: 'command' },
      { name: this.translate.instant('Script'), prop: 'script' },
      { name: this.translate.instant('Description'), prop: 'comment' },
      { name: this.translate.instant('When'), prop: 'when' },
      { name: this.translate.instant('Enabled'), prop: 'enabled' },
      { name: this.translate.instant('Timeout'), prop: 'timeout' },
    ],
    add: async () => {
      await this.showFirstTimeWarningIfNeeded();
      this.slideInService.open(InitShutdownFormComponent);
    },
    edit: async (script: InitShutdownScript) => {
      await this.showFirstTimeWarningIfNeeded();

      const modal = this.slideInService.open(InitShutdownFormComponent);
      modal.setScriptForEdit(script);
    },
  };

  sysctlTableConf: AppTableConfig = {
    title: helptextSystemAdvanced.fieldset_sysctl,
    titleHref: '/system/sysctl',
    queryCall: 'tunable.query',
    deleteCall: 'tunable.delete',
    deleteMsg: {
      title: helptextSystemAdvanced.fieldset_sysctl,
      key_props: ['var'],
    },
    parent: this,
    emptyEntityLarge: false,
    columns: [
      { name: this.translate.instant('Var'), prop: 'var' },
      { name: this.translate.instant('Value'), prop: 'value' },
      { name: this.translate.instant('Enabled'), prop: 'enabled' },
      { name: this.translate.instant('Description'), prop: 'comment' },
    ],
    add: async () => {
      await this.showFirstTimeWarningIfNeeded();
      this.slideInService.open(TunableFormComponent);
    },
    edit: async (tunable: Tunable) => {
      await this.showFirstTimeWarningIfNeeded();
      const dialog = this.slideInService.open(TunableFormComponent);
      dialog.setTunableForEdit(tunable);
    },
  };

  sessionsTableConf: AppTableConfig = {
    title: helptextSystemAdvanced.fieldset_sessions_table,
    queryCall: 'auth.sessions',
    queryCallOption: [[['internal', '=', false]]],
    parent: this,
    emptyEntityLarge: false,
    columns: [
      { name: this.translate.instant('Username'), prop: 'username' },
      { name: this.translate.instant('Start session time'), prop: 'created_at' },
    ],
    dataSourceHelper: this.sessionsSourceHelper.bind(this),
    getActions: (): AppTableAction<AuthSessionRow>[] => {
      return [
        {
          name: 'terminate',
          icon: 'exit_to_app',
          matTooltip: this.translate.instant('Terminate session'),
          onClick: (row: AuthSessionRow): void => {
            if (!row.current) {
              this.dialog
                .confirm({
                  title: this.translate.instant('Terminate session'),
                  message: this.translate.instant('Are you sure you want to terminate the session?'),
                })
                .pipe(
                  filter(Boolean),
                  untilDestroyed(this),
                ).subscribe({
                  next: () => this.terminateSession(row.id),
                  error: (err: WebsocketError) => new EntityUtils().handleError(this, err),
                });
            } else {
              this.dialog.info(
                this.translate.instant('Terminate session'),
                this.translate.instant('This session is current and cannot be terminated'),
              );
            }
          },
        },
      ];
    },
    tableFooterActions: [
      {
        label: this.translate.instant('Terminate Other Sessions'),
        onClick: () => {
          this.dialog
            .confirm({
              title: this.translate.instant('Terminate session'),
              message: this.translate.instant('Are you sure you want to terminate all other sessions?'),
            })
            .pipe(
              filter(Boolean),
              untilDestroyed(this),
            ).subscribe({
              next: () => this.terminateOtherSessions(),
              error: (err: WebsocketError) => new EntityUtils().handleError(this, err),
            });
        },
      },
    ],
  };

  constructor(
    private ws: WebSocketService2,
    private dialog: DialogService,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
    private layoutService: LayoutService,
    private store$: Store<AppState>,
    private loader: AppLoaderService,
    private ixFormatter: IxFormatterService,
  ) {}

  ngOnInit(): void {
    this.getDatasetData();
    this.store$.pipe(waitForAdvancedConfig, untilDestroyed(this)).subscribe(() => {
      this.getDatasetData();
    });

    this.store$.select(selectPreferences).pipe(filter(Boolean), untilDestroyed(this)).subscribe((preferences) => {
      this.lifetimeToken = preferences.lifetime ? preferences.lifetime.toString() : '';
      this.getDatasetData();
    });

    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshTables();
    });
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  async showFirstTimeWarningIfNeeded(): Promise<unknown> {
    if (!this.isFirstTime) {
      return;
    }

    return lastValueFrom(
      this.dialog
        .warn(helptextSystemAdvanced.first_time.title, helptextSystemAdvanced.first_time.message)
        .pipe(tap(() => this.isFirstTime = false)),
    );
  }

  formatSyslogLevel(level: string): string {
    return helptextSystemAdvanced.sysloglevel.options.find((option) => option.value === level).label;
  }

  getDatasetData(): void {
    this.ws.call('systemdataset.config').pipe(
      tap((config) => {
        if (config) {
          this.syslog = config.syslog;
          this.systemDatasetPool = config.pool;
        }
      }),
      switchMap(() => this.ws.call('replication.config.config')),
      untilDestroyed(this),
    ).subscribe((replicationConfig) => {
      this.replicationConfig = replicationConfig;

      this.getDataCardData();
    });
  }

  getDataCardData(): void {
    this.ws.call('system.advanced.config').pipe(untilDestroyed(this)).subscribe((advancedConfig) => {
      this.configData = advancedConfig;

      this.dataCards = [
        {
          title: helptextSystemAdvanced.fieldset_console,
          id: AdvancedCardId.Console,
          items: [
            {
              label: helptextSystemAdvanced.consolemenu_placeholder,
              value: advancedConfig.consolemenu ? helptext.enabled : helptext.disabled,
            },
            {
              label: helptextSystemAdvanced.serialconsole_placeholder,
              value: advancedConfig.serialconsole ? helptext.enabled : helptext.disabled,
            },
            {
              label: helptextSystemAdvanced.serialport_placeholder,
              value: advancedConfig.serialport ? advancedConfig.serialport : '–',
            },
            {
              label: helptextSystemAdvanced.serialspeed_placeholder,
              value: advancedConfig.serialspeed ? `${advancedConfig.serialspeed} bps` : '–',
            },
            {
              label: helptextSystemAdvanced.motd_placeholder,
              value: advancedConfig.motd ? advancedConfig.motd.toString() : '–',
            },
          ],
        },
        {
          title: helptextSystemAdvanced.fieldset_syslog,
          id: AdvancedCardId.Syslog,
          items: [
            {
              label: helptextSystemAdvanced.fqdn_placeholder,
              value: advancedConfig.fqdn_syslog ? helptext.enabled : helptext.disabled,
            },
            {
              label: helptextSystemAdvanced.sysloglevel.placeholder,
              value: this.formatSyslogLevel(advancedConfig.sysloglevel),
            },
            {
              label: helptextSystemAdvanced.syslogserver.placeholder,
              value: advancedConfig.syslogserver ? advancedConfig.syslogserver : '–',
            },
            {
              label: helptextSystemAdvanced.syslog_transport.placeholder,
              value: advancedConfig.syslog_transport,
            },
            {
              label: helptextSystemAdvanced.system_dataset_placeholder,
              value: this.syslog ? helptext.enabled : helptext.disabled,
            },
          ],
        },
        // TODO: Supposedly temporarly disabled https://ixsystems.atlassian.net/browse/NAS-115361
        // {
        //   title: helptextSystemAdvanced.fieldset_kernel,
        //   id: AdvancedCardId.Kernel,
        //   items: [
        //     {
        //       label: helptextSystemAdvanced.autotune_placeholder,
        //       value: advancedConfig.autotune ? helptext.enabled : helptext.disabled,
        //     },
        //     {
        //       label: helptextSystemAdvanced.debugkernel_placeholder,
        //       value: advancedConfig.debugkernel ? helptext.enabled : helptext.disabled,
        //     },
        //   ],
        // },
        {
          id: AdvancedCardId.Cron,
          title: helptextSystemAdvanced.fieldset_cron,
          tableConf: this.cronTableConf,
        },
        {
          id: AdvancedCardId.InitShutdown,
          title: helptextSystemAdvanced.fieldset_initshutdown,
          tableConf: this.initShutdownTableConf,
        },
        {
          id: AdvancedCardId.Sysctl,
          title: helptextSystemAdvanced.fieldset_sysctl,
          tableConf: this.sysctlTableConf,
        },
        {
          id: AdvancedCardId.Storage,
          title: this.translate.instant('Storage'),
          items: [
            {
              label: this.translate.instant('System Dataset Pool'),
              value: this.systemDatasetPool,
            },
            {
              label: this.translate.instant('Swap Size'),
              value: this.configData.swapondrive.toString() + ' GiB',
            },
          ],
        },
        {
          title: helptextSystemAdvanced.fieldset_replication,
          id: AdvancedCardId.Replication,
          items: [
            {
              label: helptextSystemAdvanced.max_parallel_replication_tasks_placeholder,
              value: this.replicationConfig.max_parallel_replication_tasks || '-',
            },
          ],
        },
        {
          id: AdvancedCardId.Sessions,
          title: helptextSystemAdvanced.fieldset_sessions,
          tableConf: this.sessionsTableConf,
          items: [
            {
              label: this.translate.instant('Token Lifetime'),
              value: this.lifetimeToken,
            },
          ],
        },
      ];

      this.ws.call('system.advanced.sed_global_password').pipe(untilDestroyed(this)).subscribe(
        (sedPassword) => {
          this.sedPassword = sedPassword;

          const sedCard = {
            title: helptextSystemAdvanced.fieldset_sed,
            id: AdvancedCardId.Sed,
            items: [
              {
                label: helptextSystemAdvanced.sed_user_placeholder,
                value: advancedConfig.sed_user,
              },
              {
                label: this.translate.instant('Password'),
                value: sedPassword ? '*'.repeat(sedPassword.length) : '–',
              },
            ],
          };

          this.addDataCard(sedCard);
        },
      );

      this.ws.call('device.get_info', [DeviceType.Gpu]).pipe(untilDestroyed(this)).subscribe((gpus) => {
        const isolatedGpus = gpus.filter((gpu: Device) => {
          const index = advancedConfig.isolated_gpu_pci_ids.findIndex((pciId: string) => pciId === gpu.addr.pci_slot);
          return index > -1;
        }).map((gpu: Device) => gpu.description).join(', ');

        const gpuCard = {
          title: this.translate.instant('Isolated GPU Device(s)'),
          id: AdvancedCardId.Gpus,
          items: [{ label: this.translate.instant('Isolated GPU Device(s)'), value: isolatedGpus }],
        } as DataCard<AdvancedCardId>;

        if (isolatedGpus.length === 0) {
          gpuCard.emptyConf = {
            type: EmptyType.NoPageData,
            title: this.translate.instant('No Isolated GPU Device(s) configured'),
            large: false,
            message: this.translate.instant('To configure Isolated GPU Device(s), click the "Configure" button.'),
          };
        }

        this.addDataCard(gpuCard);
      });
    });
  }

  async onSettingsPressed(name: AdvancedCardId): Promise<void> {
    await this.showFirstTimeWarningIfNeeded();
    switch (name) {
      case AdvancedCardId.Console:
        this.slideInService.open(ConsoleFormComponent);
        break;
      case AdvancedCardId.Kernel:
        this.slideInService.open(KernelFormComponent).setupForm(this.configData);
        break;
      case AdvancedCardId.Replication:
        this.slideInService.open(ReplicationSettingsComponent);
        break;
      case AdvancedCardId.Sessions:
        this.slideInService.open(TokenSettingsComponent);
        break;
      case AdvancedCardId.Syslog:
        this.slideInService.open(SyslogFormComponent);
        break;
      case AdvancedCardId.Sysctl:
        this.slideInService.open(TunableFormComponent);
        break;
      case AdvancedCardId.Storage:
        this.slideInService.open(StorageSettingsComponent).setFormForEdit({
          pool: this.systemDatasetPool,
          swapondrive: this.configData.swapondrive.toString(),
        });
        break;
      case AdvancedCardId.Gpus:
        this.slideInService.open(IsolatedGpuPcisFormComponent);
        break;
      case AdvancedCardId.Sed:
        this.slideInService.open(SedFormComponent).setupForm(this.configData, this.sedPassword);
        break;
      default:
        break;
    }
  }

  terminateSession(sessionId: string): void {
    this.loader.open();
    this.ws.call('auth.terminate_session', [sessionId]).pipe(untilDestroyed(this)).subscribe(() => {
      this.loader.close();
      this.refreshTables();
    });
  }

  terminateOtherSessions(): void {
    this.loader.open();
    this.ws.call('auth.terminate_other_sessions').pipe(untilDestroyed(this)).subscribe(() => {
      this.loader.close();
      this.refreshTables();
    });
  }

  refreshTables(): void {
    this.dataCards.forEach((card) => {
      if (card.tableConf?.tableComponent) {
        card.tableConf.tableComponent.getData();
      }
    });
  }

  cronDataSourceHelper(data: Cronjob[]): CronjobRow[] {
    return data.map((job) => {
      const schedule = `${job.schedule.minute} ${job.schedule.hour} ${job.schedule.dom} ${job.schedule.month} ${job.schedule.dow}`;
      return {
        ...job,
        cron_schedule: schedule,

        next_run: formatDistanceToNowStrict(
          cronParser.parseExpression(schedule, { iterator: true }).next().value.toDate(),
          { addSuffix: true },
        ),
      };
    });
  }

  sessionsSourceHelper(data: AuthSession[]): AuthSessionRow[] {
    console.warn(data);
    return data.map((session) => {
      return {
        id: session.id,
        current: session.current,
        username: this.getUsername(session),
        created_at: format(session.created_at.$date, 'Pp'),
      };
    });
  }

  private addDataCard(card: DataCard<AdvancedCardId>): void {
    this.dataCards = uniqBy([...this.dataCards, card], (cardElement) => cardElement.id);
  }

  private getUsername(credentialsData: AuthSessionCredentialsData): string {
    if (credentialsData && credentialsData.credentials_data) {
      return credentialsData.credentials_data.username || this.getUsername(credentialsData.credentials_data.parent);
    }
    return '';
  }
}
