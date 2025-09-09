import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, throwError, NEVER } from 'rxjs';
import { JobProgressDialogRef } from 'app/classes/job-progress-dialog-ref.class';
import { DirectoryServiceStatus, DirectoryServiceType, DirectoryServiceCredentialType } from 'app/enums/directory-services.enum';
import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';
import { LdapCredentialPlain } from 'app/interfaces/directoryservice-credentials.interface';
import { DirectoryServicesConfig } from 'app/interfaces/directoryservices-config.interface';
import { DirectoryServicesStatus } from 'app/interfaces/directoryservices-status.interface';
import { IpaConfig } from 'app/interfaces/ipa-config.interface';
import { Job } from 'app/interfaces/job.interface';
import { LdapConfig } from 'app/interfaces/ldap-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { LeaveDomainDialog } from 'app/pages/directory-service/components/leave-domain-dialog/leave-domain-dialog.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { DirectoryServicesComponent } from './directory-services.component';

type DirectoryServicesComponentWithProtected = DirectoryServicesComponent & {
  onRebuildCachePressed(): void;
  isLoading: {
    (): boolean;
    set(value: boolean): void;
  };
};

describe('DirectoryServicesComponent', () => {
  let spectator: Spectator<DirectoryServicesComponent>;
  let loader: HarnessLoader;
  let mockDirectoryServicesConfig: DirectoryServicesConfig;
  let mockServicesStatus: DirectoryServicesStatus;
  let consoleWarnSpy: jest.SpyInstance;

  beforeAll(() => {
    // Suppress console warnings about tracking expressions
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterAll(() => {
    consoleWarnSpy.mockRestore();
  });

  const createComponent = createComponentFactory({
    component: DirectoryServicesComponent,
    providers: [
      mockProvider(ApiService, {
        call: jest.fn((method: string) => {
          if (method === 'directoryservices.status') {
            return of(mockServicesStatus);
          }
          if (method === 'directoryservices.config') {
            return of(mockDirectoryServicesConfig);
          }
          return of(null);
        }),
        subscribe: jest.fn(() => {
          return of({
            fields: mockServicesStatus,
          });
        }),
      }),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of({ description: 'Directory Service cache has been rebuilt.' }),
        })),
        error: jest.fn(),
      }),
      mockProvider(SlideIn),
      mockProvider(MatDialog),
      mockProvider(AuthService, {
        hasRole: jest.fn(() => of(true)),
      }),
      mockProvider(SnackbarService),
      mockProvider(SystemGeneralService, {
        refreshDirServicesCache: jest.fn(() => of({ id: 1, state: 'SUCCESS' } as Job)),
      }),
    ],
  });

  beforeEach(() => {
    // Reset mock data before each test
    mockServicesStatus = {
      type: DirectoryServiceType.ActiveDirectory,
      status: DirectoryServiceStatus.Healthy,
      status_msg: null,
    };
    mockDirectoryServicesConfig = {
      id: 1,
      service_type: DirectoryServiceType.ActiveDirectory,
      enable: true,
      enable_account_cache: true,
      enable_dns_updates: false,
      timeout: 10,
      kerberos_realm: null,
      configuration: {
        domain: 'test.domain.com',
      } as ActiveDirectoryConfig,
      credential: {
        credential_type: DirectoryServiceCredentialType.LdapPlain,
        binddn: 'Administrator',
        bindpw: 'password',
      } as LdapCredentialPlain,
    };
  });

  describe('Menu visibility and functionality', () => {
    it('should show Settings menu item for all directory services', async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await spectator.fixture.whenStable();

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();
      const settingsItems = await menu.getItems({ text: /Settings/ });
      expect(settingsItems).toHaveLength(1);
    });

    it('should show Leave button for Active Directory when healthy', async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await spectator.fixture.whenStable();

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();
      const menuItems = await menu.getItems({ text: /Leave/ });
      expect(menuItems).toHaveLength(1);
    });

    it('should not show Leave button for Active Directory when not healthy', async () => {
      mockServicesStatus.status = DirectoryServiceStatus.Faulted;

      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await spectator.fixture.whenStable();

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();
      const menuItems = await menu.getItems({ text: /Leave/ });
      expect(menuItems).toHaveLength(0);
    });

    it('should show Leave button for IPA when healthy', async () => {
      mockServicesStatus.type = DirectoryServiceType.Ipa;
      mockServicesStatus.status = DirectoryServiceStatus.Healthy;
      mockDirectoryServicesConfig.service_type = DirectoryServiceType.Ipa;
      mockDirectoryServicesConfig.configuration = {
        domain: 'ipa.test.com',
        target_server: 'ipa.test.com',
        hostname: 'testhost',
        basedn: 'dc=test,dc=com',
      } as IpaConfig;

      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await spectator.fixture.whenStable();

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();
      const menuItems = await menu.getItems({ text: /Leave/ });
      expect(menuItems).toHaveLength(1);
    });

    it('should not show Leave button for LDAP', async () => {
      mockServicesStatus.type = DirectoryServiceType.Ldap;
      mockServicesStatus.status = DirectoryServiceStatus.Healthy;
      mockDirectoryServicesConfig.service_type = DirectoryServiceType.Ldap;
      mockDirectoryServicesConfig.configuration = {
        basedn: 'dc=test,dc=com',
      } as LdapConfig;

      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await spectator.fixture.whenStable();

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();
      const menuItems = await menu.getItems({ text: /Leave/ });
      expect(menuItems).toHaveLength(0);
    });
  });

  describe('LDAP data card', () => {
    beforeEach(() => {
      mockServicesStatus.type = DirectoryServiceType.Ldap;
      mockServicesStatus.status = DirectoryServiceStatus.Healthy;
      mockDirectoryServicesConfig.service_type = DirectoryServiceType.Ldap;
      mockDirectoryServicesConfig.configuration = {
        basedn: 'dc=test,dc=com',
        server_urls: ['ldap://server1.test.com', 'ldap://server2.test.com'],
      } as LdapConfig;
      mockDirectoryServicesConfig.credential = {
        credential_type: DirectoryServiceCredentialType.LdapPlain,
        binddn: 'cn=admin,dc=test,dc=com',
        bindpw: 'password',
      } as LdapCredentialPlain;
    });

    it('should display Server URLs in LDAP data card', async () => {
      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardContent = spectator.query('mat-card-content');
      expect(cardContent).toBeTruthy();

      const cardText = cardContent.textContent;
      expect(cardText).toContain('Server URLs');
      expect(cardText).toContain('ldap://server1.test.com, ldap://server2.test.com');
    });

    it('should display Credential Type in LDAP data card', async () => {
      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardContent = spectator.query('mat-card-content');
      expect(cardContent).toBeTruthy();

      const cardText = cardContent.textContent;
      expect(cardText).toContain('Credential Type');
      expect(cardText).toContain('Plain');
    });

    it('should display "None" when Server URLs is empty', async () => {
      (mockDirectoryServicesConfig.configuration as LdapConfig).server_urls = [];

      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardContent = spectator.query('mat-card-content');
      expect(cardContent).toBeTruthy();

      const cardText = cardContent.textContent;
      expect(cardText).toContain('Server URLs');
      expect(cardText).toContain('None');
    });

    it('should display "None" when credential is not provided', async () => {
      mockDirectoryServicesConfig.credential = null;

      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardContent = spectator.query('mat-card-content');
      expect(cardContent).toBeTruthy();

      const cardText = cardContent.textContent;
      expect(cardText).toContain('Credential Type');
      expect(cardText).toContain('None');
    });
  });

  describe('Active Directory data card', () => {
    beforeEach(() => {
      mockServicesStatus.type = DirectoryServiceType.ActiveDirectory;
      mockServicesStatus.status = DirectoryServiceStatus.Healthy;
      mockServicesStatus.status_msg = 'Connected to domain';
      mockDirectoryServicesConfig.service_type = DirectoryServiceType.ActiveDirectory;
      mockDirectoryServicesConfig.configuration = {
        domain: 'test.domain.com',
      } as ActiveDirectoryConfig;
      mockDirectoryServicesConfig.enable_account_cache = true;
    });

    it('should display Active Directory card title', async () => {
      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardTitle = spectator.query('mat-toolbar-row h3');
      expect(cardTitle).toBeTruthy();
      expect(cardTitle.textContent).toContain('Active Directory');
    });

    it('should display Status in Active Directory data card', async () => {
      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardContent = spectator.query('mat-card-content');
      expect(cardContent).toBeTruthy();

      const cardText = cardContent.textContent;
      expect(cardText).toContain('Status');
      expect(cardText).toContain('HEALTHY');
    });

    it('should display Status Message when provided', async () => {
      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardContent = spectator.query('mat-card-content');
      expect(cardContent).toBeTruthy();

      const cardText = cardContent.textContent;
      expect(cardText).toContain('Status Message');
      expect(cardText).toContain('Connected to domain');
    });

    it('should display Domain Name in Active Directory data card', async () => {
      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardContent = spectator.query('mat-card-content');
      expect(cardContent).toBeTruthy();

      const cardText = cardContent.textContent;
      expect(cardText).toContain('Domain Name');
      expect(cardText).toContain('test.domain.com');
    });

    it('should display Account Cache as Enabled when enabled', async () => {
      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardContent = spectator.query('mat-card-content');
      expect(cardContent).toBeTruthy();

      const cardText = cardContent.textContent;
      expect(cardText).toContain('Account Cache');
      expect(cardText).toContain('Enabled');
    });

    it('should display Account Cache as Disabled when disabled', async () => {
      mockDirectoryServicesConfig.enable_account_cache = false;

      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardContent = spectator.query('mat-card-content');
      expect(cardContent).toBeTruthy();

      const cardText = cardContent.textContent;
      expect(cardText).toContain('Account Cache');
      expect(cardText).toContain('Disabled');
    });

    it('should not display Status Message when not provided', async () => {
      mockServicesStatus.status_msg = null;

      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardContent = spectator.query('mat-card-content');
      expect(cardContent).toBeTruthy();

      const cardText = cardContent.textContent;
      expect(cardText).not.toContain('Status Message');
    });
  });

  describe('IPA data card', () => {
    beforeEach(() => {
      mockServicesStatus.type = DirectoryServiceType.Ipa;
      mockServicesStatus.status = DirectoryServiceStatus.Healthy;
      mockServicesStatus.status_msg = 'IPA connection established';
      mockDirectoryServicesConfig.service_type = DirectoryServiceType.Ipa;
      mockDirectoryServicesConfig.configuration = {
        domain: 'ipa.test.com',
        target_server: 'ipa-server.test.com',
        hostname: 'testhost',
        basedn: 'dc=ipa,dc=test,dc=com',
      } as IpaConfig;
    });

    it('should display IPA card title', async () => {
      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardTitle = spectator.query('mat-toolbar-row h3');
      expect(cardTitle).toBeTruthy();
      expect(cardTitle.textContent).toContain('IPA');
    });

    it('should display Status in IPA data card', async () => {
      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardContent = spectator.query('mat-card-content');
      expect(cardContent).toBeTruthy();

      const cardText = cardContent.textContent;
      expect(cardText).toContain('Status');
      expect(cardText).toContain('HEALTHY');
    });

    it('should display Status Message when provided', async () => {
      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardContent = spectator.query('mat-card-content');
      expect(cardContent).toBeTruthy();

      const cardText = cardContent.textContent;
      expect(cardText).toContain('Status Message');
      expect(cardText).toContain('IPA connection established');
    });

    it('should display Target Server in IPA data card', async () => {
      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardContent = spectator.query('mat-card-content');
      expect(cardContent).toBeTruthy();

      const cardText = cardContent.textContent;
      expect(cardText).toContain('Target Server');
      expect(cardText).toContain('ipa-server.test.com');
    });

    it('should display Domain in IPA data card', async () => {
      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardContent = spectator.query('mat-card-content');
      expect(cardContent).toBeTruthy();

      const cardText = cardContent.textContent;
      expect(cardText).toContain('Domain');
      expect(cardText).toContain('ipa.test.com');
    });

    it('should display Base DN in IPA data card', async () => {
      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardContent = spectator.query('mat-card-content');
      expect(cardContent).toBeTruthy();

      const cardText = cardContent.textContent;
      expect(cardText).toContain('Base DN');
      expect(cardText).toContain('dc=ipa,dc=test,dc=com');
    });

    it('should not display Status Message when not provided', async () => {
      mockServicesStatus.status_msg = null;

      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardContent = spectator.query('mat-card-content');
      expect(cardContent).toBeTruthy();

      const cardText = cardContent.textContent;
      expect(cardText).not.toContain('Status Message');
    });
  });

  describe('Card display logic', () => {
    it('should display LDAP card when LDAP service is active', async () => {
      mockServicesStatus.type = DirectoryServiceType.Ldap;
      mockServicesStatus.status = DirectoryServiceStatus.Healthy;
      mockDirectoryServicesConfig.service_type = DirectoryServiceType.Ldap;
      mockDirectoryServicesConfig.configuration = {
        basedn: 'dc=test,dc=com',
        server_urls: ['ldap://test.com'],
      } as LdapConfig;

      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardTitle = spectator.query('mat-toolbar-row h3');
      expect(cardTitle).toBeTruthy();
      expect(cardTitle.textContent).toContain('LDAP');
    });

    it('should display Active Directory card when AD service is active', async () => {
      mockServicesStatus.type = DirectoryServiceType.ActiveDirectory;
      mockServicesStatus.status = DirectoryServiceStatus.Healthy;
      mockDirectoryServicesConfig.service_type = DirectoryServiceType.ActiveDirectory;
      mockDirectoryServicesConfig.configuration = {
        domain: 'test.domain.com',
      } as ActiveDirectoryConfig;

      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardTitle = spectator.query('mat-toolbar-row h3');
      expect(cardTitle).toBeTruthy();
      expect(cardTitle.textContent).toContain('Active Directory');
    });

    it('should display IPA card when IPA service is active', async () => {
      mockServicesStatus.type = DirectoryServiceType.Ipa;
      mockServicesStatus.status = DirectoryServiceStatus.Healthy;
      mockDirectoryServicesConfig.service_type = DirectoryServiceType.Ipa;
      mockDirectoryServicesConfig.configuration = {
        domain: 'ipa.test.com',
        target_server: 'ipa-server.test.com',
        basedn: 'dc=ipa,dc=test,dc=com',
      } as IpaConfig;

      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardTitle = spectator.query('mat-toolbar-row h3');
      expect(cardTitle).toBeTruthy();
      expect(cardTitle.textContent).toContain('IPA');
    });
  });

  describe('Data card edge cases', () => {
    it('should display "None" for null values in Active Directory card', async () => {
      mockServicesStatus.type = DirectoryServiceType.ActiveDirectory;
      mockServicesStatus.status = DirectoryServiceStatus.Healthy;
      mockDirectoryServicesConfig.service_type = DirectoryServiceType.ActiveDirectory;
      mockDirectoryServicesConfig.configuration = {
        domain: null,
      } as ActiveDirectoryConfig;

      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardContent = spectator.query('mat-card-content');
      expect(cardContent).toBeTruthy();

      const cardText = cardContent.textContent;
      expect(cardText).toContain('Domain Name');
      expect(cardText).toContain('None');
    });

    it('should display "None" for null values in LDAP card', async () => {
      mockServicesStatus.type = DirectoryServiceType.Ldap;
      mockServicesStatus.status = DirectoryServiceStatus.Healthy;
      mockDirectoryServicesConfig.service_type = DirectoryServiceType.Ldap;
      mockDirectoryServicesConfig.configuration = {
        basedn: null,
        server_urls: null,
      } as LdapConfig;
      mockDirectoryServicesConfig.credential = null;

      spectator = createComponent();
      await spectator.fixture.whenStable();

      const cardContent = spectator.query('mat-card-content');
      expect(cardContent).toBeTruthy();

      const cardText = cardContent.textContent;
      expect(cardText).toContain('Base DN');
      expect(cardText).toContain('Server URLs');
      expect(cardText).toContain('Credential Type');
      // Should contain multiple "None" entries
      const noneMatches = cardText.match(/None/g);
      expect(noneMatches).toBeTruthy();
      expect(noneMatches.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Leave button interaction', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('should open Leave Domain dialog when Leave button is clicked', async () => {
      const dialogRef: Partial<MatDialogRef<unknown>> = {
        afterClosed: () => of(false),
      };
      const dialogOpenSpy = jest.spyOn(spectator.inject(MatDialog), 'open').mockReturnValue(dialogRef as MatDialogRef<unknown>);
      await spectator.fixture.whenStable();

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();
      const leaveMenuItem = await menu.getItems({ text: /Leave/ });
      await leaveMenuItem[0].click();

      expect(dialogOpenSpy).toHaveBeenCalledWith(LeaveDomainDialog);
    });

    it('should refresh cards after successful leave', async () => {
      // Temporarily mock console.warn to avoid jest-fail-on-console error
      const originalWarn = console.warn;
      console.warn = jest.fn();

      const dialogRef: Partial<MatDialogRef<unknown>> = {
        afterClosed: () => of(true),
      };
      jest.spyOn(spectator.inject(MatDialog), 'open').mockReturnValue(dialogRef as MatDialogRef<unknown>);
      const apiCallSpy = jest.spyOn(spectator.inject(ApiService), 'call');

      await spectator.fixture.whenStable();

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();
      const leaveMenuItem = await menu.getItems({ text: /Leave/ });
      await leaveMenuItem[0].click();

      // Verify that refreshCards was called by checking if the API calls were made
      expect(apiCallSpy).toHaveBeenCalledWith('directoryservices.status');
      expect(apiCallSpy).toHaveBeenCalledWith('directoryservices.config');

      // Restore console.warn
      console.warn = originalWarn;
    });
  });

  describe('Rebuild cache functionality', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('should show Rebuild Directory Service Cache menu item', async () => {
      await spectator.fixture.whenStable();

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();
      const rebuildMenuItem = await menu.getItems({ text: /Rebuild Directory Service Cache/ });
      expect(rebuildMenuItem).toHaveLength(1);
    });

    it('should trigger rebuild cache when menu item is clicked', async () => {
      const dialogService = spectator.inject(DialogService);
      const jobDialogSpy = jest.spyOn(dialogService, 'jobDialog');

      await spectator.fixture.whenStable();

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();
      const rebuildMenuItem = await menu.getItems({ text: /Rebuild Directory Service Cache/ });
      await rebuildMenuItem[0].click();

      expect(jobDialogSpy).toHaveBeenCalled();
    });

    it('should set loading state during rebuild cache operation', async () => {
      const dialogService = spectator.inject(DialogService);

      // Mock jobDialog to return a never-resolving observable to check loading state
      const mockJobProgressDialogRef = {
        afterClosed: () => NEVER, // Never emits to keep loading
        getSubscriptionLimiterInstance: jest.fn(),
      } as unknown as JobProgressDialogRef<unknown>;
      jest.spyOn(dialogService, 'jobDialog').mockReturnValue(mockJobProgressDialogRef);

      await spectator.fixture.whenStable();

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();
      const rebuildMenuItem = await menu.getItems({ text: /Rebuild Directory Service Cache/ });
      await rebuildMenuItem[0].click();

      expect((spectator.component as DirectoryServicesComponentWithProtected).isLoading()).toBe(true);
      expect(dialogService.jobDialog).toHaveBeenCalled();
    });

    it('should show success message when rebuild cache succeeds', async () => {
      const snackbarService = spectator.inject(SnackbarService);
      const dialogService = spectator.inject(DialogService);
      const successSpy = jest.spyOn(snackbarService, 'success');

      // Mock dialogService to return success
      const mockJobProgressDialogRef = {
        afterClosed: () => of({ description: 'Directory Service cache has been rebuilt.' } as Job),
        getSubscriptionLimiterInstance: jest.fn(),
      } as unknown as JobProgressDialogRef<unknown>;
      jest.spyOn(dialogService, 'jobDialog').mockReturnValue(mockJobProgressDialogRef);

      await spectator.fixture.whenStable();

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();
      const rebuildMenuItem = await menu.getItems({ text: /Rebuild Directory Service Cache/ });
      await rebuildMenuItem[0].click();

      expect(successSpy).toHaveBeenCalledWith('Directory Service cache has been rebuilt.');
    });

    it('should show error dialog when rebuild cache fails', async () => {
      const dialogService = spectator.inject(DialogService);
      const errorSpy = jest.spyOn(dialogService, 'error');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock jobDialog to return an observable that errors
      const mockJobProgressDialogRef = {
        afterClosed: () => throwError(() => new Error('Cache rebuild failed')),
        getSubscriptionLimiterInstance: jest.fn(),
      } as unknown as JobProgressDialogRef<unknown>;
      jest.spyOn(dialogService, 'jobDialog').mockReturnValue(mockJobProgressDialogRef);

      await spectator.fixture.whenStable();

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();
      const rebuildMenuItem = await menu.getItems({ text: /Rebuild Directory Service Cache/ });
      await rebuildMenuItem[0].click();

      expect(errorSpy).toHaveBeenCalledWith({
        title: 'Error',
        message: 'Cache rebuild failed',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to rebuild directory service cache:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it('should disable rebuild cache button when loading', async () => {
      (spectator.component as DirectoryServicesComponentWithProtected).isLoading.set(true);
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();
      const rebuildMenuItem = await menu.getItems({ text: /Rebuild Directory Service Cache/ });

      expect(await rebuildMenuItem[0].isDisabled()).toBe(true);
    });

    it('should prevent multiple concurrent rebuild operations', async () => {
      const dialogService = spectator.inject(DialogService);
      const jobDialogSpy = jest.spyOn(dialogService, 'jobDialog');

      // Mock jobDialog to return a never-resolving observable to simulate ongoing operation
      const mockJobProgressDialogRef = {
        afterClosed: () => NEVER,
        getSubscriptionLimiterInstance: jest.fn(),
      } as unknown as JobProgressDialogRef<unknown>;
      jobDialogSpy.mockReturnValue(mockJobProgressDialogRef);

      await spectator.fixture.whenStable();

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();
      const rebuildMenuItem = await menu.getItems({ text: /Rebuild Directory Service Cache/ });

      // First click should trigger the operation
      await rebuildMenuItem[0].click();
      expect(jobDialogSpy).toHaveBeenCalledTimes(1);
      expect((spectator.component as DirectoryServicesComponentWithProtected).isLoading()).toBe(true);

      // Close and reopen menu to get fresh menu items
      await menu.close();
      await menu.open();
      const rebuildMenuItemAfter = await menu.getItems({ text: /Rebuild Directory Service Cache/ });

      // Second click should be ignored since loading is true
      await rebuildMenuItemAfter[0].click();
      expect(jobDialogSpy).toHaveBeenCalledTimes(1); // Should still be 1, not 2
    });

    it('should return early from onRebuildCachePressed when already loading', async () => {
      const dialogService = spectator.inject(DialogService);
      const jobDialogSpy = jest.spyOn(dialogService, 'jobDialog');

      await spectator.fixture.whenStable();

      // Set loading state to true first
      (spectator.component as DirectoryServicesComponentWithProtected).isLoading.set(true);
      spectator.detectChanges();

      const menu = await loader.getHarness(MatMenuHarness);
      await menu.open();
      const rebuildMenuItem = await menu.getItems({ text: /Rebuild Directory Service Cache/ });

      // Click the menu item while loading is true
      await rebuildMenuItem[0].click();

      // Verify that jobDialog was not called since the method returned early
      expect(jobDialogSpy).not.toHaveBeenCalled();
    });
  });
});
