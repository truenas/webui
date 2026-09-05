import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnCheckboxHarness, TnDialog, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import {
  S3Access, S3AuditOverflow, S3LogLevel, S3PrincipalType,
} from 'app/enums/s3.enum';
import { Certificate } from 'app/interfaces/certificate.interface';
import { S3Config } from 'app/interfaces/s3.interface';
import { User } from 'app/interfaces/user.interface';
import { IxComboboxHarness } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.harness';
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceS3Component } from 'app/pages/services/components/service-s3/service-s3.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { selectLicense } from 'app/store/system-info/system-info.selectors';

describe('ServiceS3Component', () => {
  let spectator: Spectator<ServiceS3Component>;
  let loader: HarnessLoader;
  let api: ApiService;

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

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getAllSelects = (name: string): Promise<TnSelectHarness[]> => loader.getAllHarnesses(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getAllInputs = (name: string): Promise<TnInputHarness[]> => loader.getAllHarnesses(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const createComponent = createRoutingFactory({
    component: ServiceS3Component,
    imports: [ReactiveFormsModule],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('s3.config', config),
        mockCall('s3.update', config),
        mockCall('s3.bindip_choices', { '0.0.0.0': '0.0.0.0', '192.168.1.10': '192.168.1.10' }),
        mockCall('sharing.s3.audit_choices', { GetObject: 'GetObject' }),
        mockCall('user.query', [{ username: 'alice', uid: 1000 }] as User[]),
        mockCall('group.query', []),
      ]),
      mockProvider(SystemGeneralService, {
        getCertificates: () => of([{ id: 5, name: 's3-cert' }] as Certificate[]),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({ closed: of(true) })),
      }),
      provideMockStore({
        selectors: [{ selector: selectLicense, value: null }],
      }),
      ...ixFormTestingProviders(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    await spectator.fixture.whenStable();
  });

  it('loads current config into the form', async () => {
    expect(api.call).toHaveBeenCalledWith('s3.config');

    expect(await (await getSelect('address')).getDisplayText()).toBe('192.168.1.10');
    expect(await (await getInput('port')).getValue()).toBe('9000');
    expect(await (await loader.getHarness(TnCheckboxHarness.with({ label: 'TLS' }))).isChecked()).toBe(true);
    expect(await (await getSelect('certificate')).getDisplayText()).toBe('s3-cert');
    expect(await (await getInput('servers')).getValue()).toBe('2');
    expect(await (await getInput('region')).getValue()).toBe('us-east-1');
    expect(await (await getSelect('log_level')).getDisplayText()).toBe('Notice');

    expect(await (await getSelect('principal_type')).getDisplayText()).toBe('User');
    const principal = await loader.getHarness(IxComboboxHarness.with({ label: 'User' }));
    expect(await principal.getValue()).toBe('alice');
    expect(await (await getSelect('access')).getDisplayText()).toBe('Deny');
  });

  it('saves updated config', async () => {
    await (await getInput('servers')).setValue('4');
    await (await getInput('region')).setValue('eu-west-1');
    await (await getSelect('log_level')).selectOption('Info');

    const listeners = await loader.getHarness(IxListHarness.with({ label: 'Listen Addresses' }));
    await listeners.pressAddButton();
    const [, newAddress] = await getAllSelects('address');
    await newAddress.selectOption('0.0.0.0');
    const [, newPort] = await getAllInputs('port');
    await newPort.setValue('9001');

    const closed = jest.fn();
    spectator.component.closed.subscribe(closed);
    spectator.component.submit();

    expect(api.call).toHaveBeenCalledWith('s3.update', [{
      listeners: [
        { address: '192.168.1.10', port: 9000, tls: true },
        { address: '0.0.0.0', port: 9001, tls: false },
      ],
      certificate: 5,
      servers: 4,
      region: 'eu-west-1',
      log_level: S3LogLevel.Info,
      global_grants: [{ principal_type: S3PrincipalType.User, xid: 1000, access: S3Access.Deny }],
    }]);
    expect(closed).toHaveBeenCalledWith(true);
  });
});
