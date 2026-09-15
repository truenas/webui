import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { computed, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnAutocompleteHarness, TnCheckboxHarness, TnDialog, TnFormListHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { emptyRootNode } from 'app/constants/basic-root-nodes.constant';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import {
  S3Access, S3AuditOverflow, S3LogLevel, S3PrincipalType,
} from 'app/enums/s3.enum';
import { Certificate } from 'app/interfaces/certificate.interface';
import { S3Config } from 'app/interfaces/s3.interface';
import { User } from 'app/interfaces/user.interface';
import {
  ExplorerCreateDatasetComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceS3Component } from 'app/pages/services/components/service-s3/service-s3.component';
import { DatasetService } from 'app/services/dataset/dataset.service';
import { EntitlementsService } from 'app/services/entitlements.service';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('ServiceS3Component', () => {
  /**
   * Features the entitlement mock denies. A signal, as the real service returns
   * one, so a test can revoke a key on a live component the way middleware
   * would and let change detection carry it to the template.
   */
  const deniedFeatures = signal<EntitlementFeature[]>([]);

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
    managed_root_dataset: 'tank/s3',
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
      mockProvider(EntitlementsService, {
        entitled: (feature: EntitlementFeature) => computed(() => !deniedFeatures().includes(feature)),
        entitledStrictly: (feature: EntitlementFeature) => computed(() => !deniedFeatures().includes(feature)),
      }),
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
      mockProvider(DatasetService, {
        getDatasetNodeProvider: () => () => of([]),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({ closed: of(true) })),
      }),
      ...ixFormTestingProviders(),
    ],
  });

  beforeEach(async () => {
    deniedFeatures.set([]);
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
    const form = await loader.getHarness(IxFormHarness);
    expect(await form.getValues()).toMatchObject({ 'Managed Root Dataset': 'tank/s3' });

    expect(await (await getSelect('principal_type')).getDisplayText()).toBe('User');
    const principal = await loader.getHarness(TnAutocompleteHarness);
    expect(await principal.getInputValue()).toBe('alice');
    expect(await (await getSelect('access')).getDisplayText()).toBe('Deny');
  });

  it('saves updated config', async () => {
    await (await getInput('servers')).setValue('4');
    await (await getInput('region')).setValue('eu-west-1');
    await (await getSelect('log_level')).selectOption('Info');
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({ 'Managed Root Dataset': 'tank/buckets' });

    const listeners = await loader.getHarness(TnFormListHarness.with({ label: 'Listen Addresses' }));
    await listeners.add();
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
      managed_root_dataset: 'tank/buckets',
      global_grants: [{ principal_type: S3PrincipalType.User, xid: 1000, access: S3Access.Deny }],
      default_audit: [],
      default_audit_overflow: S3AuditOverflow.Drop,
    }]);
    expect(closed).toHaveBeenCalledWith(true);
  });

  describe('premium features', () => {
    // By the section's own <legend> rather than by a data-test id — see the bucket form's spec.
    const auditBadge = (): HTMLElement | null => {
      const wrapper = spectator.queryAll('ix-premium-feature-wrapper').find((element) => {
        return element.querySelector('legend')?.textContent?.includes('Auditing');
      });
      return wrapper?.querySelector('ix-premium-badge') ?? null;
    };

    it('leaves auditing untagged when the system is entitled', () => {
      expect(auditBadge()).toBeNull();
      expect(spectator.query('[data-test="select-default-audit-mode"]')).not.toBeNull();
    });

    it('tags auditing without the S3_AUDIT key, and still shows it', () => {
      // Revoked on the live component rather than rebuilt: the outer
      // `beforeEach` has already instantiated the TestBed, and overriding a
      // provider after that throws.
      deniedFeatures.set([EntitlementFeature.S3Audit]);
      spectator.detectChanges();

      expect(auditBadge()).not.toBeNull();
      expect(spectator.query('[data-test="select-default-audit-mode"]')).not.toBeNull();
    });
  });

  it('offers to create the managed root dataset from a dataset-name explorer', () => {
    expect(spectator.query(ExplorerCreateDatasetComponent)).toBeTruthy();
    // The empty root keeps the explorer in dataset-name space, so the path a created dataset comes
    // back with is stripped of /mnt before it lands in the control (see IxExplorerComponent).
    expect(spectator.query(IxExplorerComponent)!.rootNodes()).toEqual([emptyRootNode]);
  });
});
