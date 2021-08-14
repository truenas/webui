import { CdkAccordionItem } from '@angular/cdk/accordion';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, of, combineLatest } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { IdmapName } from 'app/enums/idmap-name.enum';
import helptext from 'app/helptext/directory-service/dashboard';
import idmapHelptext from 'app/helptext/directory-service/idmap';
import { Idmap } from 'app/interfaces/idmap.interface';
import { Option } from 'app/interfaces/option.interface';
import { EmptyConfig } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { AppTableConfig } from 'app/pages/common/entity/table/table.component';
import { ActiveDirectoryComponent } from 'app/pages/directory-service/components/active-directory/active-directory.component';
import { KerberosKeytabsFormComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-form.component';
import { KerberosRealmsFormComponent } from 'app/pages/directory-service/components/kerberos-realms/kerberos-realms-form.component';
import { KerberosSettingsComponent } from 'app/pages/directory-service/components/kerberos-settings/kerberos-settings.component';
import { requiredIdmapDomains } from 'app/pages/directory-service/utils/required-idmap-domains.utils';
import {
  DialogService, IdmapService, SystemGeneralService, ValidationService, WebSocketService,
} from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { ModalService } from 'app/services/modal.service';
import { T } from 'app/translate-marker';
import { IdmapFormComponent } from './components/idmap/idmap-form.component';
import { LdapComponent } from './components/ldap/ldap.component';

enum DirectoryServicesCardId {
  ActiveDirectory = 'active-directory',
  Ldap = 'ldap',
  Idmap = 'idmap',
  KerberosSettings = 'kerberos-settings',
  KerberosRealms = 'kerberos-realms',
  KerberosKeytab = 'kerberos-keytab',
}

type DataCard = { id: DirectoryServicesCardId; title: string; items: Option[] };

@UntilDestroy()
@Component({
  selector: 'directoryservices',
  templateUrl: './directory-services.component.html',
  styleUrls: ['./directory-services.component.scss'],
})
export class DirectoryServicesComponent implements OnInit {
  // Components included in this dashboard
  protected ldapFormComponent: LdapComponent;
  protected activeDirectoryFormComponent: ActiveDirectoryComponent;
  protected idmapFormComponent: IdmapFormComponent;
  protected kerberosSettingFormComponent: KerberosSettingsComponent;
  protected kerberosRealmsFormComponent: KerberosRealmsFormComponent;
  protected kerberosKeytabsFormComponent: KerberosKeytabsFormComponent;

  isActiveDirectoryEnabled = false;
  isLdapEnabled = false;

  activeDirectoryDataCard: DataCard;
  ldapDataCard: DataCard;
  kerberosSettingsDataCard: DataCard;

  idmapTableConf: AppTableConfig<this> = {
    title: helptext.idmap.title,
    titleHref: '/directoryservice/idmap',
    queryCall: 'idmap.query',
    emptyEntityLarge: false,
    parent: this,
    columns: [
      {
        name: T('Name'), prop: 'name', always_display: true, minWidth: 250,
      },
      { name: T('Backend'), prop: 'idmap_backend', maxWidth: 100 },
      { name: T('DNS Domain Name'), prop: 'dns_domain_name' },
      { name: T('Range Low'), prop: 'range_low' },
      { name: T('Range High'), prop: 'range_high' },
      { name: T('Certificate'), prop: 'cert_name' },

    ],
    add() {
      this.parent.onCardButtonPressed(DirectoryServicesCardId.Idmap);
    },
    edit(row: Idmap) {
      this.parent.onCardButtonPressed(DirectoryServicesCardId.Idmap, row.id);
    },
    getActions: () => {
      return [
        {
          id: 'delete',
          label: T('Delete'),
          name: 'delete',
          icon: 'delete',
          onClick: (row: any) => {
            this.dialog.confirm({
              title: this.translate.instant('Delete'),
              message: this.translate.instant('Are you sure you want to delete this idmap?'),
            }).pipe(
              filter(Boolean),
              switchMap(() => {
                this.loader.open();
                return this.ws.call('idmap.delete', [row.id]);
              }),
              untilDestroyed(this),
            ).subscribe(() => {
              this.loader.close();
              this.refreshTables();
            });
          },
        },
      ];
    },
    isActionVisible(actionId: string, row: Idmap) {
      if (actionId === 'delete' && requiredIdmapDomains.includes(row.name)) {
        return false;
      }

      return true;
    },

  };

  kerberosRealmsTableConf: AppTableConfig<this> = {
    title: helptext.kerberosRealms.title,
    titleHref: '/directoryservice/kerberosrealms',
    queryCall: 'kerberos.realm.query',
    deleteCall: 'kerberos.realm.delete',
    deleteMsg: {
      title: helptext.kerberosRealms.title,
      key_props: ['realm'],
    },
    emptyEntityLarge: false,
    parent: this,
    columns: [
      { name: T('Realm'), prop: 'realm', always_display: true },
      { name: T('KDC'), prop: 'kdc' },
      { name: T('Admin Server'), prop: 'admin_server' },
      { name: T('Password Server'), prop: 'kpasswd_server' },
    ],
    add() {
      this.parent.onCardButtonPressed(DirectoryServicesCardId.KerberosRealms);
    },
    edit(row) {
      this.parent.onCardButtonPressed(DirectoryServicesCardId.KerberosRealms, row.id);
    },
  };

  kerberosKeytabTableConf: AppTableConfig<this> = {
    title: helptext.kerberosKeytab.title,
    titleHref: '/directoryservice/kerberoskeytabs',
    queryCall: 'kerberos.keytab.query',
    deleteCall: 'kerberos.keytab.delete',
    deleteMsg: {
      title: helptext.kerberosKeytab.title,
      key_props: ['name'],
    },
    emptyEntityLarge: false,
    parent: this,
    columns: [
      { name: 'Name', prop: 'name', always_display: true },
    ],
    add() {
      this.parent.onCardButtonPressed(DirectoryServicesCardId.KerberosKeytab);
    },
    edit(row) {
      this.parent.onCardButtonPressed(DirectoryServicesCardId.KerberosKeytab, row.id);
    },
  };

  readonly noDirectoryServicesConfig: EmptyConfig = {
    title: this.translate.instant('Active Directory and LDAP are disabled.'),
    message: this.translate.instant('Only one can be active at a time'),
    large: true,
    icon: 'account-box',
  };

  readonly DirectoryServicesCardId = DirectoryServicesCardId;

  constructor(
    private ws: WebSocketService,
    private idmapService: IdmapService,
    private validationService: ValidationService,
    private route: ActivatedRoute,
    private sysGeneralService: SystemGeneralService,
    private modalService: ModalService,
    private dialog: DialogService,
    private loader: AppLoaderService,
    private router: Router,
    private mdDialog: MatDialog,
    private translate: TranslateService,
  ) { }

  ngOnInit(): void {
    this.refreshCards();
    combineLatest([
      this.modalService.onClose$,
      this.modalService.refreshTable$,
    ])
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.refreshCards();
      });

    this.refreshForms();
  }

  refreshCards(): void {
    this.loader.open();
    forkJoin([
      this.ws.call('directoryservices.get_state'),
      this.ws.call('activedirectory.config'),
      this.ws.call('ldap.config'),
      this.ws.call('kerberos.config'),
    ])
      .pipe(untilDestroyed(this))
      .subscribe(([servicesState, activeDirectoryConfig, ldapConfig, kerberosSettings]) => {
        this.loader.close();

        this.isActiveDirectoryEnabled = servicesState.activedirectory !== DirectoryServiceState.Disabled;
        this.isLdapEnabled = servicesState.ldap !== DirectoryServiceState.Disabled;

        this.activeDirectoryDataCard = {
          title: helptext.activeDirectory.title,
          id: DirectoryServicesCardId.ActiveDirectory,
          items: [
            {
              label: helptext.activeDirectory.status,
              value: servicesState.activedirectory,
            },
            {
              label: helptext.activeDirectory.domainName,
              value: activeDirectoryConfig?.domainname || null,
            },
            {
              label: helptext.activeDirectory.domainAccountName,
              value: activeDirectoryConfig?.bindname || null,
            },
          ],
        };
        this.ldapDataCard = {
          title: helptext.ldap.title,
          id: DirectoryServicesCardId.Ldap,
          items: [
            {
              label: helptext.ldap.status,
              value: servicesState.ldap,
            },
            {
              label: helptext.ldap.hostname,
              value: ldapConfig ? ldapConfig.hostname.join(',') : null,
            },
            {
              label: helptext.ldap.baseDN,
              value: ldapConfig?.basedn || null,
            },
            {
              label: helptext.ldap.bindDN,
              value: ldapConfig?.binddn || null,
            },
          ],
        };
        this.kerberosSettingsDataCard = {
          id: DirectoryServicesCardId.KerberosSettings,
          title: helptext.kerberosSettings.title,
          items: [
            {
              label: helptext.kerberosSettings.appdefaults,
              value: kerberosSettings?.appdefaults_aux || null,
            },
            {
              label: helptext.kerberosSettings.libdefaults,
              value: kerberosSettings?.libdefaults_aux || null,
            },
          ],
        };

        if (this.isLdapEnabled) {
          this.idmapTableConf.queryCallOption = [[['name', '=', IdmapName.DsTypeLdap]]];
        } else if (this.isActiveDirectoryEnabled) {
          this.idmapTableConf.queryCallOption = [[['name', '!=', IdmapName.DsTypeLdap]]];
        } else {
          this.idmapTableConf.queryCallOption = undefined;
        }

        this.refreshTables();
      });
  }

  onAdvancedSettingsOpened(expansionPanel: CdkAccordionItem): void {
    // Immediately show additional setting, so that user knows what they are.
    expansionPanel.open();
    this.dialog.confirm({
      title: helptext.advancedEdit.title,
      hideCheckBox: true,
      message: helptext.advancedEdit.message,
    })
      .pipe(filter((confirmed) => !confirmed), untilDestroyed(this))
      .subscribe(() => {
        // Hide settings back, if user cancels.
        expansionPanel.close();
      });
  }

  onCardButtonPressed(name: DirectoryServicesCardId, id?: number): void {
    let component: ActiveDirectoryComponent
    | IdmapFormComponent
    | LdapComponent
    | KerberosRealmsFormComponent
    | KerberosSettingsComponent
    | KerberosKeytabsFormComponent;
    switch (name) {
      case DirectoryServicesCardId.ActiveDirectory:
        component = this.activeDirectoryFormComponent;
        break;
      case DirectoryServicesCardId.Ldap:
        component = this.ldapFormComponent;
        break;
      case DirectoryServicesCardId.Idmap:
        component = this.idmapFormComponent;
        break;
      case DirectoryServicesCardId.KerberosRealms:
        component = this.kerberosRealmsFormComponent;
        break;
      case DirectoryServicesCardId.KerberosSettings:
        component = this.kerberosSettingFormComponent;
        break;
      case DirectoryServicesCardId.KerberosKeytab:
        component = this.kerberosKeytabsFormComponent;
        break;
      default:
        break;
    }

    of(true).pipe(
      switchMap(() => {
        if (name == DirectoryServicesCardId.Idmap && !id) {
          return this.idmapService.getADStatus().pipe(
            switchMap((adConfig) => {
              if (!adConfig.enable) {
                component = this.activeDirectoryFormComponent;
                return this.dialog.confirm({
                  title: idmapHelptext.idmap.enable_ad_dialog.title,
                  message: idmapHelptext.idmap.enable_ad_dialog.message,
                  hideCheckBox: true,
                  buttonMsg: idmapHelptext.idmap.enable_ad_dialog.button,
                });
              }

              return of(true);
            }),
          );
        }

        return of(true);
      }),
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => this.modalService.open('slide-in-form', component, id));
  }

  refreshTables(): void {
    [this.kerberosRealmsTableConf, this.idmapTableConf, this.kerberosKeytabTableConf].forEach((config) => {
      if (config?.tableComponent) {
        config.tableComponent.getData();
      }
    });
  }

  /**
   * All this does is provide correct typing in ng-template
   */
  typeCard(card: DataCard): DataCard {
    return card;
  }

  refreshForms(): void {
    this.activeDirectoryFormComponent = new ActiveDirectoryComponent(
      this.router,
      this.ws,
      this.modalService,
      this.mdDialog,
      this.sysGeneralService,
      this.dialog,
    );

    this.ldapFormComponent = new LdapComponent(
      this.router,
      this.ws,
      this.modalService,
      this.dialog,
      this.sysGeneralService,
    );

    this.idmapFormComponent = new IdmapFormComponent(
      this.idmapService,
      this.validationService,
      this.modalService,
      this.dialog,
      this.mdDialog,
    );

    this.kerberosSettingFormComponent = new KerberosSettingsComponent();
    this.kerberosRealmsFormComponent = new KerberosRealmsFormComponent(this.modalService);
    this.kerberosKeytabsFormComponent = new KerberosKeytabsFormComponent(this.modalService);
  }
}
