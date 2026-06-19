import { CdkAccordionItem } from '@angular/cdk/accordion';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, DestroyRef, OnInit, signal, viewChild, inject,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnDialog, TnEmptyComponent, TnListComponent, TnListItemComponent, TnMenuItem,
} from '@truenas/ui-components';
import { kebabCase } from 'lodash-es';
import {
  forkJoin,
} from 'rxjs';
import { filter, finalize } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { DirectoryServiceStatus, DirectoryServiceType } from 'app/enums/directory-services.enum';
import { Role } from 'app/enums/role.enum';
import { helptextDashboard } from 'app/helptext/directory-service/dashboard';
import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';
import { credentialTypeLabels } from 'app/interfaces/directoryservice-credentials.interface';
import { DirectoryServicesConfig } from 'app/interfaces/directoryservices-config.interface';
import { DirectoryServicesStatus } from 'app/interfaces/directoryservices-status.interface';
import { IpaConfig } from 'app/interfaces/ipa-config.interface';
import { LdapConfig } from 'app/interfaces/ldap-config.interface';
import { Option } from 'app/interfaces/option.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { DirectoryServicesFormComponent } from 'app/pages/directory-service/components/directory-services-form/directory-services-form.component';
import { KerberosKeytabsListComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-list/kerberos-keytabs-list.component';
import { KerberosRealmsListComponent } from 'app/pages/directory-service/components/kerberos-realms/kerberos-realms-list.component';
import { LeaveDomainDialog } from 'app/pages/directory-service/components/leave-domain-dialog/leave-domain-dialog.component';
import { directoryServicesElements } from 'app/pages/directory-service/directory-services.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';

interface DataCard {
  title: TranslatedString;
  items: Option[];
  onSettingsPressed: () => void;
  showLeaveButton?: boolean;
  onLeavePressed?: () => void;
}

@Component({
  selector: 'ix-directory-services',
  templateUrl: './directory-services.component.html',
  styleUrls: ['./directory-services.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnEmptyComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    UiSearchDirective,
    TnCardComponent,
    CdkAccordionItem,
    KerberosRealmsListComponent,
    KerberosKeytabsListComponent,
    TnListComponent,
    TnListItemComponent,
    TranslateModule,
  ],
})
export class DirectoryServicesComponent implements OnInit {
  private api = inject(ApiService);
  private slideIn = inject(SlideIn);
  private dialog = inject(DialogService);
  private tnDialog = inject(TnDialog);
  private loader = inject(LoaderService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private errorHandler = inject(ErrorHandlerService);
  private searchDirectives = inject(UiSearchDirectivesService);
  private snackbarService = inject(SnackbarService);
  private systemGeneralService = inject(SystemGeneralService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.DirectoryServiceWrite];
  protected readonly searchableElements = directoryServicesElements;
  protected readonly menuTriggerTestId = 'button-directory-services-actions-menu';
  private readonly hasDirectoryServiceWrite = toSignal(
    this.authService.hasRole(this.requiredRoles),
    { initialValue: false },
  );

  protected readonly directoryServicesConfig = signal<DirectoryServicesConfig | null>(null);
  protected readonly directoryServicesStatus = signal<DirectoryServicesStatus | null>(null);
  protected readonly isDirectoryServicesDisabled = computed(() => !this.directoryServicesConfig()?.enable);
  protected readonly isLoading = signal(false);

  protected readonly isActiveDirectoryEnabled = computed(
    () => this.isServiceEnabled(DirectoryServiceType.ActiveDirectory),
  );

  protected readonly isLdapEnabled = computed(() => this.isServiceEnabled(DirectoryServiceType.Ldap));
  protected readonly isIpaEnabled = computed(() => this.isServiceEnabled(DirectoryServiceType.Ipa));

  private readonly activeDirectoryDataCard = signal<DataCard | null>(null);
  private readonly ldapDataCard = signal<DataCard | null>(null);
  private readonly ipaDataCard = signal<DataCard | null>(null);

  protected readonly activeCard = computed<DataCard | null>(() => {
    if (this.isActiveDirectoryEnabled()) {
      return this.activeDirectoryDataCard();
    }
    if (this.isLdapEnabled()) {
      return this.ldapDataCard();
    }
    if (this.isIpaEnabled()) {
      return this.ipaDataCard();
    }
    return null;
  });

  protected readonly cardMenu = computed<TnMenuItem[]>(() => {
    const card = this.activeCard();
    if (!card) {
      return [];
    }

    const baseTestId = kebabCase(card.title);
    const items: TnMenuItem[] = [
      {
        id: 'settings',
        label: this.translate.instant('Settings'),
        icon: 'cog',
        iconLibrary: 'mdi',
        testId: `button-${baseTestId}-settings`,
        action: () => card.onSettingsPressed(),
      },
    ];

    if (this.hasDirectoryServiceWrite()) {
      items.push({
        id: 'rebuild-cache',
        label: this.translate.instant('Rebuild Directory Service Cache'),
        icon: 'refresh',
        iconLibrary: 'mdi',
        disabled: this.isLoading(),
        testId: `button-${baseTestId}-rebuild-cache`,
        action: () => this.onRebuildCachePressed(),
      });

      if (card.showLeaveButton) {
        items.push({
          id: 'leave',
          label: this.translate.instant('Leave'),
          icon: 'close-circle',
          iconLibrary: 'mdi',
          testId: `button-${baseTestId}-leave`,
          action: () => card.onLeavePressed(),
        });
      }
    }

    return items;
  });

  private readonly kerberosKeytabsListComponent = viewChild(KerberosKeytabsListComponent);
  private readonly kerberosRealmsListComponent = viewChild(KerberosRealmsListComponent);

  constructor() {
    setTimeout(() => this.handlePendingGlobalSearchElement(), searchDelayConst * 5);
  }

  ngOnInit(): void {
    this.refreshCards();
    this.subscribeToDirectoryServicesStatus();
  }

  private isServiceEnabled(type: DirectoryServiceType): boolean {
    const status = this.directoryServicesStatus();
    return status?.type === type && status.status !== DirectoryServiceStatus.Disabled;
  }

  protected refreshCards(): void {
    forkJoin([
      this.api.call('directoryservices.status'),
      this.api.call('directoryservices.config'),
    ])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([servicesState, directoryServicesConfig]) => {
        this.directoryServicesConfig.set(directoryServicesConfig);
        this.directoryServicesStatus.set(servicesState);
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

          this.activeDirectoryDataCard.set({
            title: this.translate.instant(helptextDashboard.activeDirectory.title),
            items,
            onSettingsPressed: () => this.openDirectoryServicesForm(),
            showLeaveButton: servicesState.status === DirectoryServiceStatus.Healthy,
            onLeavePressed: () => this.openLeaveDialog(),
          });
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

          this.ldapDataCard.set({
            title: this.translate.instant(helptextDashboard.ldap.title),
            items,
            onSettingsPressed: () => this.openDirectoryServicesForm(),
          });
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

          this.ipaDataCard.set({
            title: this.translate.instant(helptextDashboard.ipa.title),
            items,
            onSettingsPressed: () => this.openDirectoryServicesForm(),
            showLeaveButton: servicesState.status === DirectoryServiceStatus.Healthy,
            onLeavePressed: () => this.openLeaveDialog(),
          });
        }

        this.refreshTables();
        this.cdr.markForCheck();
      });
  }

  private subscribeToDirectoryServicesStatus(): void {
    this.api.subscribe('directoryservices.status')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        const status = event.fields as DirectoryServicesStatus;
        this.directoryServicesStatus.set(status);

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
      .pipe(filter((confirmed) => !confirmed), takeUntilDestroyed(this.destroyRef))
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
    }).onSuccess(() => this.refreshCards(), this.destroyRef);
  }

  refreshTables(): void {
    if (this.kerberosKeytabsListComponent()) {
      this.kerberosKeytabsListComponent().getKerberosKeytabs();
    }
    if (this.kerberosRealmsListComponent()) {
      this.kerberosRealmsListComponent().getKerberosRealms();
    }
  }

  protected openLeaveDialog(): void {
    this.tnDialog.open(LeaveDomainDialog)
      .closed
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.refreshCards();
      });
  }


  private handlePendingGlobalSearchElement(): void {
    const pendingHighlightElement = this.searchDirectives.pendingUiHighlightElement;

    if (pendingHighlightElement) {
      this.searchDirectives.get(pendingHighlightElement)?.highlight(pendingHighlightElement);
    }
  }

  protected onRebuildCachePressed(): void {
    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.dialog
      .jobDialog(this.systemGeneralService.refreshDirServicesCache())
      .afterClosed()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ description }) => {
          this.snackbarService.success(
            this.translate.instant(description || helptextDashboard.rebuildCache.success),
          );
        },
        error: (error: unknown) => {
          const errorMessage = error instanceof Error && error.message
            ? error.message
            : helptextDashboard.rebuildCache.error;
          this.dialog.error({
            title: this.translate.instant(helptextDashboard.rebuildCache.errorTitle),
            message: this.translate.instant(errorMessage),
          });
          console.error('Failed to rebuild directory service cache:', error);
        },
      });
  }
}
