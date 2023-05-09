import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import {
  mockCall, mockJob, mockWebsocket,
} from 'app/core/testing/utils/mock-websocket.utils';
import { IdmapBackend, IdmapName, IdmapSslEncryptionMode } from 'app/enums/idmap.enum';
import helptext from 'app/helptext/directory-service/idmap';
import { IdmapBackendOptions } from 'app/interfaces/idmap-backend-options.interface';
import { Idmap } from 'app/interfaces/idmap.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import {
  WithManageCertificatesLinkComponent,
} from 'app/modules/ix-forms/components/with-manage-certificates-link/with-manage-certificates-link.component';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { IdmapFormComponent } from 'app/pages/directory-service/components/idmap-form/idmap-form.component';
import {
  DialogService, IdmapService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { IxSlideIn2Service } from 'app/services/ix-slide-in2.service';
import { WebSocketService } from 'app/services/ws.service';

describe('IdmapFormComponent', () => {
  let spectator: Spectator<IdmapFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const existingIdmap = {
    id: 10,
    name: 'Existing',
    dns_domain_name: 'dns.com',
    range_low: 1000000,
    range_high: 1000001,
    idmap_backend: IdmapBackend.Ad,
    options: {
      schema_mode: 'RFC2307',
      unix_primary_group: false,
      unix_nss_info: true,
    } as Record<string, unknown>,
  } as Idmap;

  const createComponent = createComponentFactory({
    component: IdmapFormComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
      EntityModule,
    ],
    declarations: [
      MockComponent(WithManageCertificatesLinkComponent),
    ],
    providers: [
      mockWebsocket([
        mockCall('idmap.create'),
        mockCall('idmap.update'),
        mockJob('idmap.clear_idmap_cache', fakeSuccessfulJob()),
      ]),
      mockProvider(IdmapService, {
        getCerts: () => of([
          { id: 1, name: 'Certificate 1' },
          { id: 2, name: 'Certificate 2' },
        ]),
        getBackendChoices: () => of({
          [IdmapBackend.Ad]: {
            parameters: {
              schema_mode: { required: false, default: 'RFC2307' },
              unix_primary_group: { required: false, default: false },
              unix_nss_info: { required: false, default: false },
            },
          },
          [IdmapBackend.Ldap]: {
            parameters: {
              ldap_base_dn: { required: true, default: null },
              ldap_user_dn: { required: true, default: null },
              ldap_url: { required: true, default: null },
              ldap_user_dn_password: { required: false, default: null },
              ssl: { required: false, default: IdmapSslEncryptionMode.Off },
              validate_certificates: { required: false, default: true },
              readonly: { required: false, default: false },
            },
          },
          [IdmapBackend.Tdb]: {
            parameters: {
              readonly: { required: false, default: false },
            },
          },
        } as unknown as IdmapBackendOptions),
      }),
      mockProvider(IxSlideInService),
      mockProvider(IxSlideIn2Service),
      mockProvider(Router),
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(false)),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('shows values for an existing idmap', async () => {
    spectator.component.setIdmapForEdit(existingIdmap);

    const formValues = await form.getValues();

    expect(formValues).toEqual({
      Name: 'Custom Value',
      'Custom Name': 'Existing',
      'Idmap Backend': 'AD',
      'DNS Domain Name': 'dns.com',
      'Range High': '1000001',
      'Range Low': '1000000',
      'Schema Mode': 'RFC2307',
      'Unix Primary Group': false,
      'Unix NSS Info': true,
    });
  });

  it('updates values for an existing idmap when update form is saved', async () => {
    spectator.component.setIdmapForEdit(existingIdmap);

    await form.fillForm({
      'Unix Primary Group': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('idmap.update', [
      10,
      {
        dns_domain_name: 'dns.com',
        idmap_backend: IdmapBackend.Ad,
        name: 'Existing',
        range_high: 1000001,
        range_low: 1000000,
        options: {
          schema_mode: 'RFC2307',
          unix_nss_info: true,
          unix_primary_group: true,
        },
      },
    ]);
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });

  it('creates a new idmap when form is submitted for creation', async () => {
    await form.fillForm({
      Name: 'Custom Value',
    });
    await form.fillForm({
      'Custom Name': 'Test',
      'Idmap Backend': 'AD',
      'Range Low': 2000000,
      'Range High': 2000001,
      'Schema Mode': 'SFU',
      'Unix Primary Group': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('idmap.create', [{
      idmap_backend: IdmapBackend.Ad,
      range_high: 2000001,
      range_low: 2000000,
      name: 'Test',
      options: {
        schema_mode: 'SFU',
        unix_primary_group: true,
      },
    }]);
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });

  it('sets name to TDB and hides it when SMB - Primary Domain is selected', async () => {
    await form.fillForm({
      Name: 'SMB - Primary Domain',
    });
    await form.fillForm({
      'Range Low': 2000000,
      'Range High': 2000001,
    });

    const controls = await form.getLabels();
    expect(controls).not.toContain('Idmap Backend');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('idmap.create', [{
      idmap_backend: IdmapBackend.Tdb,
      name: IdmapName.DsTypeDefaultDomain,
      range_high: 2000001,
      range_low: 2000000,
      options: {},
    }]);
  });

  it('shows option controls and their default values based on backend choices coming from middleware', async () => {
    await form.fillForm({
      'Idmap Backend': 'LDAP',
    });

    const formValues = await form.getValues();
    expect(formValues).toMatchObject({
      'Encryption Mode': 'Off',
      'Idmap Backend': 'LDAP',
      'LDAP User DN': '',
      'LDAP User DN Password': '',
      'Read Only': false,
      URL: '',
    });
  });

  it('shows certificate field when LDAP or RFC2307 are selected as backends', async () => {
    await form.fillForm({
      'Idmap Backend': 'LDAP',
    });

    const labels = await form.getLabels();
    expect(labels).toContain('Certificate');
  });

  it('asks and clears idmap cache after form is saved', async () => {
    const confirm = spectator.inject(DialogService).confirm as jest.Mock;
    confirm.mockReturnValue(of(true));

    await form.fillForm({
      Name: 'SMB - Primary Domain',
    });
    await form.fillForm({
      'Range Low': 2000000,
      'Range High': 2000001,
    });
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(confirm).toHaveBeenCalledWith({
      title: helptext.idmap.clear_cache_dialog.title,
      message: helptext.idmap.clear_cache_dialog.message,
      hideCheckbox: true,
    });
    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('idmap.clear_idmap_cache', []);
  });
});
