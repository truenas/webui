import { CdkAccordionItem } from '@angular/cdk/accordion';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, viewChild,
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
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { Role } from 'app/enums/role.enum';
import { helptextDashboard } from 'app/helptext/directory-service/dashboard';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ActiveDirectoryComponent } from 'app/pages/directory-service/components/active-directory/active-directory.component';
import { IdmapListComponent } from 'app/pages/directory-service/components/idmap-list/idmap-list.component';
import { KerberosKeytabsListComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-list/kerberos-keytabs-list.component';
import { KerberosRealmsListComponent } from 'app/pages/directory-service/components/kerberos-realms/kerberos-realms-list.component';
import { KerberosSettingsComponent } from 'app/pages/directory-service/components/kerberos-settings/kerberos-settings.component';
import { directoryServicesElements } from 'app/pages/directory-service/directory-services.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { LdapComponent } from './components/ldap/ldap.component';

interface DataCard {
  title: string;
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
    IdmapListComponent,
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

  isActiveDirectoryEnabled = false;
  isLdapEnabled = false;

  activeDirectoryDataCard: DataCard;
  ldapDataCard: DataCard;
  kerberosSettingsDataCard: DataCard;

  private readonly idmapListComponent = viewChild.required(IdmapListComponent);
  private readonly kerberosKeytabsListComponent = viewChild.required(KerberosKeytabsListComponent);
  private readonly kerberosRealmsListComponent = viewChild.required(KerberosRealmsListComponent);

  readonly noDirectoryServicesConfig: EmptyConfig = {
    title: this.translate.instant('Active Directory and LDAP are disabled.'),
    message: this.translate.instant('Only one can be active at a time.'),
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

  refreshCards(): void {
    forkJoin([
      this.api.call('directoryservices.get_state'),
      this.api.call('activedirectory.config'),
      this.api.call('ldap.config'),
      this.api.call('kerberos.config'),
    ])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(([servicesState, activeDirectoryConfig, ldapConfig, kerberosSettings]) => {
        this.isActiveDirectoryEnabled = servicesState.activedirectory !== DirectoryServiceState.Disabled;
        this.isLdapEnabled = servicesState.ldap !== DirectoryServiceState.Disabled;

        this.activeDirectoryDataCard = {
          title: helptextDashboard.activeDirectory.title,
          items: [
            {
              label: helptextDashboard.activeDirectory.status,
              value: servicesState.activedirectory,
            },
            {
              label: helptextDashboard.activeDirectory.domainName,
              value: activeDirectoryConfig?.domainname || null,
            },
            {
              label: helptextDashboard.activeDirectory.domainAccountName,
              value: activeDirectoryConfig?.bindname || null,
            },
          ],
          onSettingsPressed: () => this.openActiveDirectoryForm(),
        };
        this.ldapDataCard = {
          title: helptextDashboard.ldap.title,
          items: [
            {
              label: helptextDashboard.ldap.status,
              value: servicesState.ldap,
            },
            {
              label: helptextDashboard.ldap.hostname,
              value: ldapConfig ? ldapConfig.hostname.join(',') : null,
            },
            {
              label: helptextDashboard.ldap.baseDN,
              value: ldapConfig?.basedn || null,
            },
            {
              label: helptextDashboard.ldap.bindDN,
              value: ldapConfig?.binddn || null,
            },
          ],
          onSettingsPressed: () => this.openLdapForm(),
        };
        this.kerberosSettingsDataCard = {
          title: helptextDashboard.kerberosSettings.title,
          items: [
            {
              label: helptextDashboard.kerberosSettings.appdefaults,
              value: kerberosSettings?.appdefaults_aux || null,
            },
            {
              label: helptextDashboard.kerberosSettings.libdefaults,
              value: kerberosSettings?.libdefaults_aux || null,
            },
          ],
          onSettingsPressed: () => this.openKerberosSettingsForm(),
        };

        this.refreshTables();
        this.cdr.markForCheck();
      });
  }

  onAdvancedSettingsOpened(expansionPanel: CdkAccordionItem): void {
    // Immediately show additional setting, so that user knows what they are.
    expansionPanel.open();
    this.dialog.confirm({
      title: helptextDashboard.advancedEdit.title,
      hideCheckbox: true,
      message: helptextDashboard.advancedEdit.message,
    })
      .pipe(filter((confirmed) => !confirmed), untilDestroyed(this))
      .subscribe(() => {
        // Hide settings back, if user cancels.
        expansionPanel.close();
      });
  }

  openActiveDirectoryForm(): void {
    this.slideIn.open(ActiveDirectoryComponent, { wide: true }).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => this.refreshCards());
  }

  openLdapForm(): void {
    this.slideIn.open(LdapComponent, { wide: true }).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => this.refreshCards());
  }

  openKerberosSettingsForm(): void {
    this.slideIn.open(KerberosSettingsComponent).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => this.refreshCards());
  }

  refreshTables(): void {
    if (this.idmapListComponent()) {
      this.idmapListComponent().getIdmaps();
    }
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
  typeCard(card: DataCard): DataCard {
    return card;
  }
}
