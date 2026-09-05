import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import {
  S3Access, S3AuditOverflow, S3LogLevel, S3PrincipalType,
} from 'app/enums/s3.enum';
import { Certificate } from 'app/interfaces/certificate.interface';
import { S3Config } from 'app/interfaces/s3.interface';
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceS3Component } from 'app/pages/services/components/service-s3/service-s3.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { UserService } from 'app/services/user.service';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

describe('ServiceS3Component', () => {
  let spectator: Spectator<ServiceS3Component>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const config = {
    id: 1,
    listeners: [{ address: '192.168.1.10', port: 9000, tls: true }],
    servers: 2,
    certificate: 5,
    region: 'us-east-1',
    log_level: S3LogLevel.Notice,
    default_audit: [],
    default_audit_overflow: S3AuditOverflow.Drop,
    global_grants: [
      {
        principal_type: S3PrincipalType.User, xid: 1000, name: 'alice', access: S3Access.Deny,
      },
    ],
  } as S3Config;

  const createComponent = createComponentFactory({
    component: ServiceS3Component,
    imports: [ReactiveFormsModule],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('s3.config', config),
        mockCall('s3.update', config),
        mockCall('s3.bindip_choices', { '0.0.0.0': '0.0.0.0', '192.168.1.10': '192.168.1.10' }),
        mockCall('sharing.s3.audit_choices', { GetObject: 'GetObject' }),
      ]),
      mockProvider(SystemGeneralService, {
        getCertificates: () => of([{ id: 5, name: 's3-cert' }] as Certificate[]),
      }),
      mockProvider(UserService, {
        userQueryDsCache: () => of([{ username: 'alice', uid: 1000 }]),
        groupQueryDsCache: () => of([]),
      }),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(),
      }),
      mockProvider(SnackbarService),
      provideMockStore({
        selectors: [{ selector: selectIsEnterprise, value: false }],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('loads current config into the form', async () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('s3.config');

    const values = await form.getValues();
    expect(values).toMatchObject({
      Address: '192.168.1.10',
      Port: '9000',
      TLS: true,
      Certificate: 's3-cert',
      'Server Threads': '2',
      Region: 'us-east-1',
      'Log Level': 'Notice',
    });

    const grants = await loader.getHarness(IxListHarness.with({ label: 'Global Grants' }));
    expect(await grants.getFormValues()).toEqual([{
      Principal: 'User',
      User: 'alice',
      Access: 'Deny',
    }]);
  });

  it('saves updated config', async () => {
    await form.fillForm({
      'Server Threads': 4,
      Region: '',
      'Log Level': 'Info',
    });

    const listeners = await loader.getHarness(IxListHarness.with({ label: 'Listen Addresses' }));
    await listeners.pressAddButton();
    const newListener = await listeners.getLastListItem();
    await newListener.fillForm({
      Address: '0.0.0.0',
      Port: 9001,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('s3.update', [{
      listeners: [
        { address: '192.168.1.10', port: 9000, tls: true },
        { address: '0.0.0.0', port: 9001, tls: false },
      ],
      certificate: 5,
      servers: 4,
      region: '',
      log_level: S3LogLevel.Info,
      global_grants: [{ principal_type: S3PrincipalType.User, xid: 1000, access: S3Access.Deny }],
    }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Service configuration saved');
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: true });
  });
});
