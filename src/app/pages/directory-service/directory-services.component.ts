import { CdkAccordionItem } from '@angular/cdk/accordion';
import { Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  forkJoin, of, merge, Observable,
} from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { IdmapName } from 'app/enums/idmap.enum';
import helptext from 'app/helptext/directory-service/dashboard';
import idmapHelptext from 'app/helptext/directory-service/idmap';
import { Idmap } from 'app/interfaces/idmap.interface';
import { KerberosKeytab } from 'app/interfaces/kerberos-config.interface';
import { KerberosRealm } from 'app/interfaces/kerberos-realm.interface';
import { Option } from 'app/interfaces/option.interface';
import { EmptyConfig } from 'app/modules/entity/entity-empty/entity-empty.component';
import { AppTableConfig } from 'app/modules/entity/table/table.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ActiveDirectoryComponent } from 'app/pages/directory-service/components/active-directory/active-directory.component';
import { IdmapFormComponent } from 'app/pages/directory-service/components/idmap-form/idmap-form.component';
import { KerberosKeytabsFormComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-form/kerberos-keytabs-form.component';
import { KerberosSettingsComponent } from 'app/pages/directory-service/components/kerberos-settings/kerberos-settings.component';
import { requiredIdmapDomains } from 'app/pages/directory-service/utils/required-idmap-domains.utils';
import {
  DialogService, IdmapService, WebSocketService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { ModalService } from 'app/services/modal.service';
import { KerberosRealmsFormComponent } from './components/kerberos-realms-form/kerberos-realms-form.component';
import { LdapComponent } from './components/ldap/ldap.component';

interface DataCard {
  title: string;
  items: Option[];
  onSettingsPressed: () => void;
}

@UntilDestroy()
@Component({
  templateUrl: './directory-services.component.html',
  styleUrls: ['./directory-services.component.scss'],
})
export class DirectoryServicesComponent implements OnInit {
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
      { name: this.translate.instant('Name'), prop: 'name' },
      { name: this.translate.instant('Backend'), prop: 'idmap_backend' },
      { name: this.translate.instant('DNS Domain Name'), prop: 'dns_domain_name' },
      { name: this.translate.instant('Range Low'), prop: 'range_low' },
      { name: this.translate.instant('Range High'), prop: 'range_high' },
      { name: this.translate.instant('Certificate'), prop: 'cert_name' },

    ],
    add: () => {
      this.ensureActiveDirectoryIsEnabledForIdmap()
        .pipe(untilDestroyed(this))
        .subscribe(() => {
          this.slideInService.open(IdmapFormComponent);
        });
    },
    edit: (row: Idmap) => {
      const slideIn = this.slideInService.open(IdmapFormComponent);
      slideIn.setIdmapForEdit(row);
    },
    getActions: () => {
      return [
        {
          id: 'delete',
          label: this.translate.instant('Delete'),
          name: 'delete',
          icon: 'delete',
          onClick: (row: Idmap) => {
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
      if (actionId === 'delete' && requiredIdmapDomains.includes(row.name as IdmapName)) {
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
      { name: this.translate.instant('Realm'), prop: 'realm' },
      { name: this.translate.instant('KDC'), prop: 'kdc' },
      { name: this.translate.instant('Admin Server'), prop: 'admin_server' },
      { name: this.translate.instant('Password Server'), prop: 'kpasswd_server' },
    ],
    add: () => {
      this.slideInService.open(KerberosRealmsFormComponent);
    },
    edit: (realm: KerberosRealm) => {
      const modal = this.slideInService.open(KerberosRealmsFormComponent);
      modal.setRealmForEdit(realm);
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
      { name: 'Name', prop: 'name' },
    ],
    add: () => {
      this.slideInService.open(KerberosKeytabsFormComponent);
    },
    edit: (row: KerberosKeytab) => {
      const slideIn = this.slideInService.open(KerberosKeytabsFormComponent);
      slideIn.setKerberosKeytabsForEdit(row);
    },
  };

  readonly noDirectoryServicesConfig: EmptyConfig = {
    title: this.translate.instant('Active Directory and LDAP are disabled.'),
    message: this.translate.instant('Only one can be active at a time.'),
    large: true,
    icon: 'account-box',
  };

  constructor(
    private ws: WebSocketService,
    private idmapService: IdmapService,
    private modalService: ModalService,
    private slideInService: IxSlideInService,
    private dialog: DialogService,
    private loader: AppLoaderService,
    private translate: TranslateService,
  ) {
  }

  ngOnInit(): void {
    this.refreshCards();
    merge(
      this.slideInService.onClose$.pipe(filter((res) => !!res)),
      this.modalService.refreshTable$,
    )
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.refreshCards();
      });
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
          onSettingsPressed: () => this.openActiveDirectoryForm(),
        };
        this.ldapDataCard = {
          title: helptext.ldap.title,
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
          onSettingsPressed: () => this.openLdapForm(),
        };
        this.kerberosSettingsDataCard = {
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
          onSettingsPressed: () => this.openKerberosSettingsForm(),
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

  openActiveDirectoryForm(): void {
    this.slideInService.open(ActiveDirectoryComponent, { wide: true });
  }

  openLdapForm(): void {
    this.slideInService.open(LdapComponent, { wide: true });
  }

  openKerberosSettingsForm(): void {
    this.slideInService.open(KerberosSettingsComponent);
  }

  refreshTables(): void {
    [this.kerberosRealmsTableConf, this.idmapTableConf, this.kerberosKeytabTableConf].forEach((config) => {
      if (config.tableComponent) {
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

  private ensureActiveDirectoryIsEnabledForIdmap(): Observable<boolean> {
    return this.idmapService.getActiveDirectoryStatus().pipe(
      switchMap((adConfig) => {
        if (adConfig.enable) {
          return of(true);
        }

        return this.dialog.confirm({
          title: idmapHelptext.idmap.enable_ad_dialog.title,
          message: idmapHelptext.idmap.enable_ad_dialog.message,
          hideCheckBox: true,
          buttonMsg: idmapHelptext.idmap.enable_ad_dialog.button,
        })
          .pipe(
            filter((confirmed) => confirmed),
            switchMap(() => {
              this.openActiveDirectoryForm();
              return of(false);
            }),
          );
      }),
      filter((canContinue) => canContinue),
    );
  }
}
