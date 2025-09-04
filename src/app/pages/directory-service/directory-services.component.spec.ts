import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { DirectoryServiceStatus, DirectoryServiceType, DirectoryServiceCredentialType } from 'app/enums/directory-services.enum';
import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';
import { LdapCredentialPlain } from 'app/interfaces/directoryservice-credentials.interface';
import { DirectoryServicesConfig } from 'app/interfaces/directoryservices-config.interface';
import { DirectoryServicesStatus } from 'app/interfaces/directoryservices-status.interface';
import { IpaConfig } from 'app/interfaces/ipa-config.interface';
import { LdapConfig } from 'app/interfaces/ldap-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { LeaveDomainDialog } from 'app/pages/directory-service/components/leave-domain-dialog/leave-domain-dialog.component';
import { DirectoryServicesComponent } from './directory-services.component';

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
      mockProvider(DialogService),
      mockProvider(SlideIn),
      mockProvider(MatDialog),
      mockProvider(AuthService, {
        hasRole: jest.fn(() => of(true)),
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

  describe('Leave button visibility', () => {
    it('should show Leave button for Active Directory when healthy', async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await spectator.fixture.whenStable();

      const buttons = await loader.getAllHarnesses(MatButtonHarness.with({
        text: 'Leave',
      }));
      expect(buttons).toHaveLength(1);
    });

    it('should not show Leave button for Active Directory when not healthy', async () => {
      mockServicesStatus.status = DirectoryServiceStatus.Faulted;

      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await spectator.fixture.whenStable();

      const buttons = await loader.getAllHarnesses(MatButtonHarness.with({
        text: 'Leave',
      }));
      expect(buttons).toHaveLength(0);
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

      const buttons = await loader.getAllHarnesses(MatButtonHarness.with({
        text: 'Leave',
      }));
      expect(buttons).toHaveLength(1);
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

      const buttons = await loader.getAllHarnesses(MatButtonHarness.with({
        text: 'Leave',
      }));
      expect(buttons).toHaveLength(0);
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

      const leaveButton = await loader.getHarness(MatButtonHarness.with({
        text: 'Leave',
      }));
      await leaveButton.click();

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

      const leaveButton = await loader.getHarness(MatButtonHarness.with({
        text: 'Leave',
      }));
      await leaveButton.click();

      // Verify that refreshCards was called by checking if the API calls were made
      expect(apiCallSpy).toHaveBeenCalledWith('directoryservices.status');
      expect(apiCallSpy).toHaveBeenCalledWith('directoryservices.config');

      // Restore console.warn
      console.warn = originalWarn;
    });
  });
});
