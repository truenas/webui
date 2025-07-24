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
import { KerberosConfig } from 'app/interfaces/kerberos-config.interface';
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
          if (method === 'kerberos.config') {
            return of({
              id: 1,
              appdefaults_aux: '',
              libdefaults_aux: '',
            } as KerberosConfig);
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
      expect(apiCallSpy).toHaveBeenCalledWith('kerberos.config');

      // Restore console.warn
      console.warn = originalWarn;
    });
  });
});
