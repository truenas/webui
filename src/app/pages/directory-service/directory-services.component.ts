import { CdkAccordionItem } from '@angular/cdk/accordion';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, OnInit, signal, viewChild, inject,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
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
import { credentialTypeLabels } from 'app/interfaces/directoryservice-credentials.interface';
import { DirectoryServicesConfig } from 'app/interfaces/directoryservices-config.interface';
import { DirectoryServicesStatus } from 'app/interfaces/directoryservices-status.interface';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { IpaConfig } from 'app/interfaces/ipa-config.interface';
import { LdapConfig } from 'app/interfaces/ldap-config.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { DirectoryServicesFormComponent } from 'app/pages/directory-service/components/directory-services-form/directory-services-form.component';
import { KerberosKeytabsListComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-list/kerberos-keytabs-list.component';
import { KerberosRealmsListComponent } from 'app/pages/directory-service/components/kerberos-realms/kerberos-realms-list.component';
import { LeaveDomainDialog } from 'app/pages/directory-service/components/leave-domain-dialog/leave-domain-dialog.component';
import { directoryServicesElements } from 'app/pages/directory-service/directory-services.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

interface DataCard {
  title: TranslatedString;
  items: Option[];
  onSettingsPressed: () => void;
  showLeaveButton?: boolean;
  onLeavePressed?: () => void;
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
  private api = inject(ApiService);
  private slideIn = inject(SlideIn);
  private dialog = inject(DialogService);
  private matDialog = inject(MatDialog);
  private loader = inject(LoaderService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);

  protected readonly requiredRoles = [Role.DirectoryServiceWrite];
  protected readonly searchableElements = directoryServicesElements;

  protected isActiveDirectoryEnabled = false;
  protected isLdapEnabled = false;
  protected isIpaEnabled = false;
  protected readonly directoryServicesConfig = signal<DirectoryServicesConfig | null>(null);
  protected readonly directoryServicesStatus = signal<DirectoryServicesStatus | null>(null);
  protected readonly isDirectoryServicesDisabled = computed(() => !this.directoryServicesConfig()?.enable);

  protected activeDirectoryDataCard: DataCard;
  protected ldapDataCard: DataCard;
  protected ipaDataCard: DataCard;

  private readonly kerberosKeytabsListComponent = viewChild(KerberosKeytabsListComponent);
  private readonly kerberosRealmsListComponent = viewChild(KerberosRealmsListComponent);

  readonly noDirectoryServicesConfig: EmptyConfig = {
    title: this.translate.instant('Directory services are disabled.'),
    message: this.translate.instant('Configure directory services to see details.'),
    large: true,
    icon: iconMarker('mdi-account-box'),
  };

  ngOnInit(): void {
    this.refreshCards();
    this.subscribeToDirectoryServicesStatus();
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

  protected refreshCards(): void {
    forkJoin([
      this.api.call('directoryservices.status'),
      this.api.call('directoryservices.config'),
    ])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(([servicesState, directoryServicesConfig]) => {
        this.directoryServicesConfig.set(directoryServicesConfig);
        this.directoryServicesStatus.set(servicesState);
        this.isActiveDirectoryEnabled = servicesState.type === DirectoryServiceType.ActiveDirectory
        && servicesState.status !== DirectoryServiceStatus.Disabled;
        this.isLdapEnabled = servicesState.type === DirectoryServiceType.Ldap
        && servicesState.status !== DirectoryServiceStatus.Disabled;

        this.isIpaEnabled = servicesState.type === DirectoryServiceType.Ipa
        && servicesState.status !== DirectoryServiceStatus.Disabled;
        const adConfig = directoryServicesConfig?.configuration as ActiveDirectoryConfig;
        if (adConfig && directoryServicesConfig) {
          const items: Option[] = [
            {
              label: this.translate.instant(helptextDashboard.activeDirectory.status),
              value: servicesState.type === DirectoryServiceType.ActiveDirectory
                ? servicesState.status
                : DirectoryServiceStatus.Disabled,
            },
          ];

          // Add status message right after status if it exists
          if (servicesState.status_msg) {
            items.push({
              label: this.translate.instant(helptextDashboard.activeDirectory.statusMessage),
              value: servicesState.status_msg,
            });
          }

          items.push(
            {
              label: this.translate.instant(helptextDashboard.activeDirectory.domainName),
              value: adConfig.domain || null,
            },
            {
              label: this.translate.instant(helptextDashboard.activeDirectory.accountCache),
              value: directoryServicesConfig?.enable_account_cache
                ? this.translate.instant('Enabled')
                : this.translate.instant('Disabled'),
            },
          );

          this.activeDirectoryDataCard = {
            title: this.translate.instant(helptextDashboard.activeDirectory.title),
            items,
            onSettingsPressed: () => this.openDirectoryServicesForm(),
            showLeaveButton: servicesState.status === DirectoryServiceStatus.Healthy,
            onLeavePressed: () => this.openLeaveDialog(),
          };
        }

        const ldapConfig = directoryServicesConfig?.configuration as LdapConfig;
        if (ldapConfig && directoryServicesConfig) {
          const items: Option[] = [
            {
              label: this.translate.instant(helptextDashboard.ldap.status),
              value: servicesState.type === DirectoryServiceType.Ldap
                ? servicesState.status
                : DirectoryServiceStatus.Disabled,
            },
          ];

          // Add status message right after status if it exists
          if (servicesState.status_msg) {
            items.push({
              label: this.translate.instant(helptextDashboard.ldap.statusMessage),
              value: servicesState.status_msg,
            });
          }

          items.push(
            {
              label: this.translate.instant(helptextDashboard.ldap.serverUrls),
              value: ldapConfig.server_urls?.join(', ') || null,
            },
            {
              label: this.translate.instant(helptextDashboard.ldap.baseDN),
              value: ldapConfig.basedn || null,
            },
            {
              label: this.translate.instant(helptextDashboard.ldap.credentialType),
              value: directoryServicesConfig?.credential
                ? this.translate.instant(
                  credentialTypeLabels[directoryServicesConfig.credential.credential_type],
                )
                : null,
            },
          );

          this.ldapDataCard = {
            title: this.translate.instant(helptextDashboard.ldap.title),
            items,
            onSettingsPressed: () => this.openDirectoryServicesForm(),
          };
        }

        const ipaConfig = directoryServicesConfig?.configuration as IpaConfig;
        if (ipaConfig && directoryServicesConfig) {
          const items: Option[] = [
            {
              label: this.translate.instant(helptextDashboard.ipa.status),
              value: servicesState.type === DirectoryServiceType.Ipa
                ? servicesState.status
                : DirectoryServiceStatus.Disabled,
            },
          ];

          // Add status message right after status if it exists
          if (servicesState.status_msg) {
            items.push({
              label: this.translate.instant(helptextDashboard.ipa.statusMessage),
              value: servicesState.status_msg,
            });
          }

          items.push(
            {
              label: this.translate.instant(helptextDashboard.ipa.target_server),
              value: ipaConfig.target_server,
            },
            {
              label: this.translate.instant(helptextDashboard.ipa.domain),
              value: ipaConfig.domain,
            },
            {
              label: this.translate.instant(helptextDashboard.ipa.basedn),
              value: ipaConfig.basedn,
            },
          );

          this.ipaDataCard = {
            title: this.translate.instant(helptextDashboard.ipa.title),
            items,
            onSettingsPressed: () => this.openDirectoryServicesForm(),
            showLeaveButton: servicesState.status === DirectoryServiceStatus.Healthy,
            onLeavePressed: () => this.openLeaveDialog(),
          };
        }

        this.refreshTables();
        this.cdr.markForCheck();
      });
  }

  private subscribeToDirectoryServicesStatus(): void {
    this.api.subscribe('directoryservices.status')
      .pipe(
        untilDestroyed(this),
      )
      .subscribe((event) => {
        const status = event.fields as DirectoryServicesStatus;
        this.directoryServicesStatus.set(status);

        // Update enabled states based on new status
        this.isActiveDirectoryEnabled = status.type === DirectoryServiceType.ActiveDirectory
        && status.status !== DirectoryServiceStatus.Disabled;
        this.isLdapEnabled = status.type === DirectoryServiceType.Ldap
        && status.status !== DirectoryServiceStatus.Disabled;
        this.isIpaEnabled = status.type === DirectoryServiceType.Ipa
        && status.status !== DirectoryServiceStatus.Disabled;

        // Refresh the cards to update the UI with new status
        this.refreshCards();
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

    // Refresh tables when accordion is opened
    // Using setTimeout to ensure components are rendered first
    setTimeout(() => {
      this.refreshTables();
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

  protected openLeaveDialog(): void {
    this.matDialog.open(LeaveDomainDialog)
      .afterClosed()
      .pipe(
        filter(Boolean),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.refreshCards();
      });
  }
}
