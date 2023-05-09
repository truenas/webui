import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import helptext from 'app/helptext/directory-service/active-directory';
import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';
import { DirectoryServicesState } from 'app/interfaces/directory-services-state.interface';
import { KerberosRealm } from 'app/interfaces/kerberos-realm.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  ActiveDirectoryComponent,
} from 'app/pages/directory-service/components/active-directory/active-directory.component';
import {
  LeaveDomainDialogComponent,
} from 'app/pages/directory-service/components/leave-domain-dialog/leave-domain-dialog.component';
import {
  DialogService, SystemGeneralService, WebSocketService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('ActiveDirectoryComponent', () => {
  let spectator: Spectator<ActiveDirectoryComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const existingConfig = {
    id: 1,
    allow_dns_updates: true,
    allow_trusted_doms: false,
    bindname: 'Administrator',
    bindpw: '',
    createcomputer: 'Computers/Servers/NAS',
    disable_freenas_cache: false,
    dns_timeout: 10,
    domainname: 'AD.IXSYSTEMS.NET',
    enable: false,
    kerberos_principal: '',
    kerberos_realm: 2,
    netbiosalias: ['alias1', 'alias2'],
    netbiosname: 'truenas',
    nss_info: 'SFU20',
    restrict_pam: false,
    site: 'site-name',
    timeout: 60,
    use_default_domain: false,
    verbose_logging: true,
  } as ActiveDirectoryConfig;
  const createComponent = createComponentFactory({
    component: ActiveDirectoryComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('directoryservices.get_state', {
          activedirectory: DirectoryServiceState.Disabled,
        } as DirectoryServicesState),
        mockCall('activedirectory.config', existingConfig),
        mockCall('activedirectory.update', {} as ActiveDirectoryConfig),
        mockCall('kerberos.realm.query', [
          { id: 1, realm: 'ad.ixsystems.net' },
          { id: 2, realm: 'directory.ixsystems.net' },
        ] as KerberosRealm[]),
        mockCall('kerberos.keytab.kerberos_principal_choices', [
          'TRUENAS$@AD.IXSYSTEMS.NET',
          'TRUENAS2$@AD.IXSYSTEMS.NET',
        ]),
        mockCall('activedirectory.nss_info_choices', ['SFU', 'SFU20']),
      ]),
      mockProvider(SystemGeneralService, {
        refreshDirServicesCache: jest.fn(() => of(null)),
      }),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockProvider(IxSlideInService),
    ],
    declarations: [
      LeaveDomainDialogComponent,
      MockComponent(EntityJobComponent),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('loads and shows active directory config', async () => {
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('directoryservices.get_state');
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('activedirectory.config');

    const values = await form.getValues();
    expect(values).toEqual({
      'Domain Account Name': 'Administrator',
      'Domain Account Password': '',
      'Domain Name': 'AD.IXSYSTEMS.NET',
      'Enable (requires password or Kerberos principal)': false,
    });
  });

  it('does not show Account Name and Password when Kerberos principal is set', async () => {
    spectator.inject(MockWebsocketService).mockCall('activedirectory.config', {
      ...existingConfig,
      kerberos_principal: 'TRUENAS$@AD.IXSYSTEMS.NET',
    });
    spectator.component.ngOnInit();

    const values = await form.getValues();
    expect(values).toEqual({
      'Domain Name': 'AD.IXSYSTEMS.NET',
      'Enable (requires password or Kerberos principal)': false,
    });
  });

  it('shows advanced fields when Advanced Options button is pressed', async () => {
    const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
    await advancedButton.click();

    const values = await form.getValues();
    expect(values).toEqual({
      'Domain Name': 'AD.IXSYSTEMS.NET',
      'Domain Account Name': 'Administrator',
      'Domain Account Password': '',
      'Enable (requires password or Kerberos principal)': false,
      'Verbose Logging': true,
      'Allow Trusted Domains': false,
      'Use Default Domain': false,
      'Allow DNS Updates': true,
      'Disable AD User / Group Cache': false,
      'Restrict PAM': false,

      'Site Name': 'site-name',
      'Kerberos Realm': 'directory.ixsystems.net',
      'Kerberos Principal': '',
      'Computer Account OU': 'Computers/Servers/NAS',
      'AD Timeout': '60',
      'DNS Timeout': '10',
      'Winbind NSS Info': 'SFU20',
      'Netbios Name': 'truenas',
      'NetBIOS Alias': ['alias1', 'alias2'],
    });
  });

  it('rebuilds directory service cache when Rebuild Cache is pressed', async () => {
    const rebuildButton = await loader.getHarness(MatButtonHarness.with({ text: 'Rebuild Directory Service Cache' }));
    await rebuildButton.click();

    expect(spectator.inject(SystemGeneralService).refreshDirServicesCache).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
      helptext.activedirectory_custactions_clearcache_dialog_message,
    );
  });

  it('saves active directory settings when form is submitted', async () => {
    await form.fillForm({
      'Domain Name': 'ad.truenas.com',
      'Domain Account Name': 'Administrator',
      'Domain Account Password': '12345678',
      'Enable (requires password or Kerberos principal)': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('activedirectory.update', [{
      domainname: 'ad.truenas.com',
      bindname: 'Administrator',
      bindpw: '12345678',
      enable: true,
      verbose_logging: true,
      allow_trusted_doms: false,
      use_default_domain: false,
      allow_dns_updates: true,
      disable_freenas_cache: false,
      restrict_pam: false,
      site: 'site-name',
      kerberos_realm: 2,
      kerberos_principal: '',
      createcomputer: 'Computers/Servers/NAS',
      timeout: 60,
      dns_timeout: 10,
      nss_info: 'SFU20',
      netbiosname: 'truenas',
      netbiosalias: ['alias1', 'alias2'],
    }]);
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });

  it('shows EntityJobComponent when activedirectory.update returns a job id', async () => {
    spectator.inject(MockWebsocketService).mockCall('activedirectory.update', {
      job_id: 12345,
    });
    const matDialog = spectator.inject(MatDialog);
    const entityJobComponent = {
      jobId: undefined,
      wsshow: jest.fn(),
      success: of(null),
      failure: of(),
    } as unknown as EntityJobComponent;
    jest.spyOn(matDialog, 'open').mockImplementation(() => ({
      componentInstance: entityJobComponent,
      close: () => {},
    } as MatDialogRef<EntityJobComponent>));

    await form.fillForm({
      'Domain Name': 'ad.truenas.com',
      'Domain Account Name': 'Administrator',
      'Domain Account Password': '12345678',
      'Enable (requires password or Kerberos principal)': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(matDialog.open).toHaveBeenCalledWith(EntityJobComponent, {
      data: {
        title: 'Active Directory',
      },
      disableClose: true,
    });
    expect(entityJobComponent.jobId).toBe(12345);
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });

  describe('leave domain button', () => {
    beforeEach(() => {
      spectator.inject(MockWebsocketService).mockCall('directoryservices.get_state', {
        activedirectory: DirectoryServiceState.Healthy,
      } as DirectoryServicesState);
      spectator.component.ngOnInit();
    });

    it('shows Leave Domain button when Active Directory is setup', async () => {
      const leaveDomainButton = await loader.getHarness(MatButtonHarness.with({ text: 'Leave Domain' }));
      expect(leaveDomainButton).toBeTruthy();
    });

    it('opens LeaveDomainDialogComponent component when Leave Domain button is pressed', async () => {
      jest.spyOn(spectator.inject(MatDialog), 'open');

      const leaveDomainButton = await loader.getHarness(MatButtonHarness.with({ text: 'Leave Domain' }));
      await leaveDomainButton.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(LeaveDomainDialogComponent);
    });
  });
});
