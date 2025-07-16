import { CdkAccordionItem } from '@angular/cdk/accordion';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, OnInit, signal, viewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  forkJoin,
} from 'rxjs';
import { filter } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { DirectoryServiceStatus, DirectoryServiceType } from 'app/enums/directory-services.enum';
import { Role } from 'app/enums/role.enum';
import { helptextDashboard } from 'app/helptext/directory-service/dashboard';
import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';
import { LdapCredentialPlain } from 'app/interfaces/directoryservice-credentials.interface';
import { DirectoryServicesConfig } from 'app/interfaces/directoryservices-config.interface';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { IpaConfig } from 'app/interfaces/ipa-config.interface';
import { LdapConfig } from 'app/interfaces/ldap-config.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { DirectoryServicesFormComponent } from 'app/pages/directory-service/components/directory-services-form/directory-services-form.component';
import { KerberosKeytabsListComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-list/kerberos-keytabs-list.component';
import { KerberosRealmsListComponent } from 'app/pages/directory-service/components/kerberos-realms/kerberos-realms-list.component';
import { KerberosSettingsComponent } from 'app/pages/directory-service/components/kerberos-settings/kerberos-settings.component';
import { directoryServicesElements } from 'app/pages/directory-service/directory-services.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

interface DataCard {
  title: TranslatedString;
  items: Option[];
  onSettingsPressed: () => void;
}

@UntilDestroy()
@Component({
  selector: 'ix-directory-services',
  templateUrl: './directory-services.component.html',
  styleUrls: ['./directory-services.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmptyComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    UiSearchDirective,
    NgTemplateOutlet,
    MatCard,
    MatToolbarRow,
    MatCardContent,
    CdkAccordionItem,
    KerberosRealmsListComponent,
    KerberosKeytabsListComponent,
    MatList,
    MatListItem,
    TranslateModule,
  ],
})
export class DirectoryServicesComponent implements OnInit {
  protected readonly requiredRoles = [Role.DirectoryServiceWrite];
  protected readonly searchableElements = directoryServicesElements;

  protected isActiveDirectoryEnabled = false;
  protected isLdapEnabled = false;
  protected isIpaEnabled = false;
  protected readonly directoryServicesConfig = signal<DirectoryServicesConfig | null>(null);
  protected readonly isDirectoryServicesDisabled = computed(() => !this.directoryServicesConfig()?.enable);

  protected activeDirectoryDataCard: DataCard;
  protected ldapDataCard: DataCard;
  protected ipaDataCard: DataCard;
  protected kerberosSettingsDataCard: DataCard;

  private readonly kerberosKeytabsListComponent = viewChild.required(KerberosKeytabsListComponent);
  private readonly kerberosRealmsListComponent = viewChild.required(KerberosRealmsListComponent);

  readonly noDirectoryServicesConfig: EmptyConfig = {
    title: this.translate.instant('Directory services are disabled.'),
    message: this.translate.instant('Configure directory services to see details.'),
    large: true,
    icon: iconMarker('mdi-account-box'),
  };

  constructor(
    private api: ApiService,
    private slideIn: SlideIn,
    private dialog: DialogService,
    private loader: LoaderService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
  ) {
  }

  ngOnInit(): void {
    this.refreshCards();
  }

  protected getDataCard(): DataCard {
    let dataCard: DataCard;
    if (this.isActiveDirectoryEnabled) {
      dataCard = this.activeDirectoryDataCard;
    }

    if (this.isLdapEnabled) {
      dataCard = this.ldapDataCard;
    }

    if (this.isIpaEnabled) {
      dataCard = this.ipaDataCard;
    }
    return dataCard;
  }

  private refreshCards(): void {
    forkJoin([
      this.api.call('directoryservices.status'),
      this.api.call('directoryservices.config'),
      this.api.call('kerberos.config'),
    ])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(([servicesState, directoryServicesConfig, kerberosSettings]) => {
        this.directoryServicesConfig.set(directoryServicesConfig);
        this.isActiveDirectoryEnabled = servicesState.type === DirectoryServiceType.ActiveDirectory
        && servicesState.status !== DirectoryServiceStatus.Disabled;
        this.isLdapEnabled = servicesState.type === DirectoryServiceType.Ldap
        && servicesState.status !== DirectoryServiceStatus.Disabled;

        this.isIpaEnabled = servicesState.type === DirectoryServiceType.Ipa
        && servicesState.status !== DirectoryServiceStatus.Disabled;
        const adConfig = directoryServicesConfig?.configuration as ActiveDirectoryConfig;
        if (adConfig) {
          this.activeDirectoryDataCard = {
            title: this.translate.instant(helptextDashboard.activeDirectory.title),
            items: [
              {
                label: this.translate.instant(helptextDashboard.activeDirectory.status),
                value: servicesState.type === DirectoryServiceType.ActiveDirectory
                  ? servicesState.status
                  : DirectoryServiceStatus.Disabled,
              },
              {
                label: this.translate.instant(helptextDashboard.activeDirectory.domainName),
                value: adConfig.domain || null,
              },
              {
                label: this.translate.instant(helptextDashboard.activeDirectory.domainAccountName),
                value: (directoryServicesConfig?.credential as LdapCredentialPlain).binddn || null,
              },
            ],
            onSettingsPressed: () => this.openDirectoryServicesForm(),
          };
        }

        const ldapConfig = directoryServicesConfig?.configuration as LdapConfig;
        if (ldapConfig) {
          this.ldapDataCard = {
            title: this.translate.instant(helptextDashboard.ldap.title),
            items: [
              {
                label: this.translate.instant(helptextDashboard.ldap.status),
                value: servicesState.type === DirectoryServiceType.Ldap
                  ? servicesState.status
                  : DirectoryServiceStatus.Disabled,
              },
              {
                label: this.translate.instant(helptextDashboard.ldap.baseDN),
                value: ldapConfig.basedn || null,
              },
              {
                label: this.translate.instant(helptextDashboard.ldap.bindDN),
                value: (directoryServicesConfig?.credential as LdapCredentialPlain).binddn || null,
              },
            ],
            onSettingsPressed: () => this.openDirectoryServicesForm(),
          };
        }

        const ipaConfig = directoryServicesConfig.configuration as IpaConfig;
        if (ipaConfig) {
          this.ipaDataCard = {
            title: this.translate.instant(helptextDashboard.ipa.title),
            items: [
              {
                label: this.translate.instant(helptextDashboard.ipa.target_server),
                value: ipaConfig.target_server,
              },
              {
                label: this.translate.instant(helptextDashboard.ipa.hostname),
                value: ipaConfig.hostname,
              },
              {
                label: this.translate.instant(helptextDashboard.ipa.domain),
                value: ipaConfig.domain,
              },
              {
                label: this.translate.instant(helptextDashboard.ipa.basedn),
                value: ipaConfig.basedn,
              },
            ],
            onSettingsPressed: () => this.openDirectoryServicesForm(),
          };
        }
        this.kerberosSettingsDataCard = {
          title: this.translate.instant(helptextDashboard.kerberosSettings.title),
          items: [
            {
              label: this.translate.instant(helptextDashboard.kerberosSettings.appdefaults),
              value: kerberosSettings?.appdefaults_aux || null,
            },
            {
              label: this.translate.instant(helptextDashboard.kerberosSettings.libdefaults),
              value: kerberosSettings?.libdefaults_aux || null,
            },
          ],
          onSettingsPressed: () => this.openKerberosSettingsForm(),
        };

        this.refreshTables();
        this.cdr.markForCheck();
      });
  }

  protected onAdvancedSettingsOpened(expansionPanel: CdkAccordionItem): void {
    // Immediately show additional setting, so that user knows what they are.
    expansionPanel.open();
    this.dialog.confirm({
      title: this.translate.instant(helptextDashboard.advancedEdit.title),
      hideCheckbox: true,
      message: this.translate.instant(helptextDashboard.advancedEdit.message),
    })
      .pipe(filter((confirmed) => !confirmed), untilDestroyed(this))
      .subscribe(() => {
        // Hide settings back, if user cancels.
        expansionPanel.close();
      });
  }

  protected openDirectoryServicesForm(): void {
    this.slideIn.open(DirectoryServicesFormComponent, {
      data: this.directoryServicesConfig(),
    }).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => this.refreshCards());
  }

  private openKerberosSettingsForm(): void {
    this.slideIn.open(KerberosSettingsComponent).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => this.refreshCards());
  }

  refreshTables(): void {
    if (this.kerberosKeytabsListComponent()) {
      this.kerberosKeytabsListComponent().getKerberosKeytabs();
    }
    if (this.kerberosRealmsListComponent()) {
      this.kerberosRealmsListComponent().getKerberosRealms();
    }
  }

  /**
   * All this does is provide correct typing in ng-template
   */
  protected typeCard(card: DataCard): DataCard {
    return card;
  }
}
