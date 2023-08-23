import { CdkAccordionItem } from '@angular/cdk/accordion';
import { Component, OnInit, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  forkJoin, of, Observable,
} from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import helptext from 'app/helptext/directory-service/dashboard';
import idmapHelptext from 'app/helptext/directory-service/idmap';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { Idmap } from 'app/interfaces/idmap.interface';
import { Option } from 'app/interfaces/option.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ActiveDirectoryComponent } from 'app/pages/directory-service/components/active-directory/active-directory.component';
import IdmapListComponent from 'app/pages/directory-service/components/idmap-list/idmap-list.component';
import KerberosKeytabsListComponent from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-list/kerberos-keytabs-list.component';
import KerberosRealmsListComponent from 'app/pages/directory-service/components/kerberos-realms/kerberos-realms-list.component';
import { KerberosSettingsComponent } from 'app/pages/directory-service/components/kerberos-settings/kerberos-settings.component';
import { DialogService } from 'app/services/dialog.service';
import { IdmapService } from 'app/services/idmap.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
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

  protected idmapQueryCall: Observable<Idmap[]> = this.ws.call('idmap.query');
  @ViewChild(IdmapListComponent) idmapListComponent: IdmapListComponent;
  @ViewChild(KerberosKeytabsListComponent) kerberosKeytabsListComponent: KerberosKeytabsListComponent;
  @ViewChild(KerberosRealmsListComponent) kerberosRealmsListComponent: KerberosRealmsListComponent;

  readonly noDirectoryServicesConfig: EmptyConfig = {
    title: this.translate.instant('Active Directory and LDAP are disabled.'),
    message: this.translate.instant('Only one can be active at a time.'),
    large: true,
    icon: 'account-box',
  };

  constructor(
    private ws: WebSocketService,
    private idmapService: IdmapService,
    private slideInService: IxSlideInService,
    private dialog: DialogService,
    private loader: AppLoaderService,
    private translate: TranslateService,
  ) {
  }

  ngOnInit(): void {
    this.refreshCards();
  }

  refreshCards(): void {
    forkJoin([
      this.ws.call('directoryservices.get_state'),
      this.ws.call('activedirectory.config'),
      this.ws.call('ldap.config'),
      this.ws.call('kerberos.config'),
    ])
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe(([servicesState, activeDirectoryConfig, ldapConfig, kerberosSettings]) => {
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

        this.refreshTables();
      });
  }

  onAdvancedSettingsOpened(expansionPanel: CdkAccordionItem): void {
    // Immediately show additional setting, so that user knows what they are.
    expansionPanel.open();
    this.dialog.confirm({
      title: helptext.advancedEdit.title,
      hideCheckbox: true,
      message: helptext.advancedEdit.message,
    })
      .pipe(filter((confirmed) => !confirmed), untilDestroyed(this))
      .subscribe(() => {
        // Hide settings back, if user cancels.
        expansionPanel.close();
      });
  }

  openActiveDirectoryForm(): void {
    const slideInRef = this.slideInService.open(ActiveDirectoryComponent, { wide: true });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.refreshCards());
  }

  openLdapForm(): void {
    const slideInRef = this.slideInService.open(LdapComponent, { wide: true });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.refreshCards());
  }

  openKerberosSettingsForm(): void {
    const slideInRef = this.slideInService.open(KerberosSettingsComponent);
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.refreshCards());
  }

  refreshTables(): void {
    if (this.idmapListComponent) {
      this.idmapListComponent.getIdmaps();
    }
    if (this.kerberosKeytabsListComponent) {
      this.kerberosKeytabsListComponent.getKerberosKeytabs();
    }
    if (this.kerberosRealmsListComponent) {
      this.kerberosRealmsListComponent.getKerberosRealms();
    }
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
          hideCheckbox: true,
          buttonText: idmapHelptext.idmap.enable_ad_dialog.button,
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
