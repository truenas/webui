import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnDialog, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { NetcatMode } from 'app/enums/netcat-mode.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { KeychainCredential } from 'app/interfaces/keychain-credential.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import {
  SshCredentialsSelectComponent,
} from 'app/modules/forms/custom-selects/ssh-credentials-select/ssh-credentials-select.component';
import {
  TransportSectionComponent,
} from 'app/pages/data-protection/replication/replication-form/sections/transport-section/transport-section.component';

describe('TransportSectionComponent', () => {
  let spectator: Spectator<TransportSectionComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: TransportSectionComponent,
    imports: [
      ReactiveFormsModule,
      SshCredentialsSelectComponent,
    ],
    providers: [
      mockApi([
        mockCall('keychaincredential.query', [
          { id: 1, name: 'connection 1' },
          { id: 2, name: 'connection 2' },
        ] as KeychainCredential[]),
      ]),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(true),
        })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  const getTnInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getTnSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getTnCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSshSelect = (): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ ancestor: '[formControlName="ssh_credentials"]' }),
  );
  const getSpeedLimit = (): Promise<TnInputHarness> => getTnInput('speed_limit');

  describe('SSH transport', () => {
    beforeEach(() => {
      spectator.setInput('transport', TransportMode.Ssh);
    });

    it('shows defaults for new replication', async () => {
      expect(await (await getSshSelect()).getDisplayText()).toBe('Select an option');
      expect(await (await getTnSelect('compression')).getDisplayText()).toBe('Disabled');
      expect(await (await getSpeedLimit()).getValue()).toBe('');
      expect(await (await getTnCheckbox('large_block')).isChecked()).toBe(true);
      expect(await (await getTnCheckbox('compressed')).isChecked()).toBe(true);
    });

    it('shows existing values when editing a replication', async () => {
      spectator.setInput('replication', {
        ssh_credentials: {
          id: 1,
        },
        speed_limit: 2 * GiB,
        large_block: true,
        compressed: false,
      } as ReplicationTask);

      expect(await (await getSshSelect()).getDisplayText()).toBe('connection 1');
      expect(await (await getTnSelect('compression')).getDisplayText()).toBe('Disabled');
      expect(await (await getSpeedLimit()).getValue()).toBe('2 GiB');
      expect(await (await getTnCheckbox('large_block')).isChecked()).toBe(true);
      expect(await (await getTnCheckbox('compressed')).isChecked()).toBe(false);
    });

    it('returns payload when getPayload() is called', async () => {
      await (await getSshSelect()).selectOption('connection 2');
      await (await getTnSelect('compression')).selectOption('lz4 (fastest)');

      expect(spectator.component.getPayload()).toEqual({
        ssh_credentials: 2,
        compression: 'LZ4',
        compressed: true,
        large_block: true,
        speed_limit: null,
        netcat_active_side: null,
        netcat_active_side_listen_address: null,
        netcat_active_side_port_max: null,
        netcat_active_side_port_min: null,
        netcat_passive_side_connect_address: null,
      });
    });

    it('includes speed_limit as null when not provided in SSH mode', async () => {
      // make it *something* and get the value
      await (await getSshSelect()).selectOption('connection 1');
      await (await getSpeedLimit()).setValue('1GiB');
      const shouldHaveLimit = spectator.component.getPayload();
      expect(shouldHaveLimit).toHaveProperty('speed_limit', 1 * GiB);

      // then, make it empty and ensure that it does properly return null
      // (an empty size field maps to a null byte count in the model)
      spectator.component.form.controls.speed_limit.setValue(null);

      const shouldNotHaveLimit = spectator.component.getPayload();
      expect(shouldNotHaveLimit).toHaveProperty('speed_limit', null);
    });

    it('sends compression: null in payload when it is disabled', async () => {
      await (await getTnSelect('compression')).selectOption('Disabled');

      expect(spectator.component.getPayload()).toMatchObject({
        compression: null,
      });
    });
  });

  describe('SSH+NETCAT transport', () => {
    beforeEach(() => {
      spectator.setInput('transport', TransportMode.Netcat);
    });

    it('shows defaults for new replication', async () => {
      expect(await (await getSshSelect()).getDisplayText()).toBe('Select an option');
      expect(await (await getTnSelect('netcat_active_side')).getDisplayText()).toBe('LOCAL');
      expect(await (await getTnInput('netcat_active_side_listen_address')).getValue()).toBe('');
      expect(await (await getTnInput('netcat_active_side_port_min')).getValue()).toBe('');
      expect(await (await getTnInput('netcat_active_side_port_max')).getValue()).toBe('');
      expect(await (await getTnInput('netcat_passive_side_connect_address')).getValue()).toBe('');
      expect(await (await getTnCheckbox('large_block')).isChecked()).toBe(true);
      expect(await (await getTnCheckbox('compressed')).isChecked()).toBe(true);
    });

    it('shows existing values when editing a replication', async () => {
      spectator.setInput('replication', {
        ssh_credentials: {
          id: 2,
        },
        netcat_active_side: NetcatMode.Remote,
        netcat_active_side_listen_address: '0.0.0.0',
        netcat_active_side_port_min: 1000,
        netcat_active_side_port_max: 2000,
        netcat_passive_side_connect_address: '127.0.0.1',
        large_block: false,
      } as ReplicationTask);

      expect(await (await getSshSelect()).getDisplayText()).toBe('connection 2');
      expect(await (await getTnSelect('netcat_active_side')).getDisplayText()).toBe('REMOTE');
      expect(await (await getTnInput('netcat_active_side_listen_address')).getValue()).toBe('0.0.0.0');
      expect(await (await getTnInput('netcat_active_side_port_min')).getValue()).toBe('1000');
      expect(await (await getTnInput('netcat_active_side_port_max')).getValue()).toBe('2000');
      expect(await (await getTnInput('netcat_passive_side_connect_address')).getValue()).toBe('127.0.0.1');
      expect(await (await getTnCheckbox('large_block')).isChecked()).toBe(false);
      expect(await (await getTnCheckbox('compressed')).isChecked()).toBe(true);
    });

    it('returns payload with null fields when getPayload() is called', async () => {
      await (await getSshSelect()).selectOption('connection 1');
      await (await getTnSelect('netcat_active_side')).selectOption('LOCAL');
      await (await getTnInput('netcat_active_side_listen_address')).setValue('0.0.0.0');
      await (await getTnInput('netcat_active_side_port_min')).setValue('1000');
      await (await getTnCheckbox('compressed')).uncheck();

      expect(spectator.component.getPayload()).toEqual({
        ssh_credentials: 1,
        netcat_active_side: 'LOCAL',
        netcat_active_side_listen_address: '0.0.0.0',
        netcat_active_side_port_min: 1000,
        compressed: false,
        large_block: true,
        speed_limit: null,
      });
    });

    it('returns payload with non-null fields when getPayload() is called', async () => {
      await (await getSshSelect()).selectOption('connection 1');
      await (await getTnSelect('netcat_active_side')).selectOption('LOCAL');
      await (await getTnInput('netcat_active_side_listen_address')).setValue('0.0.0.0');
      await (await getTnInput('netcat_active_side_port_min')).setValue('1000');
      await (await getTnInput('netcat_active_side_port_max')).setValue('2000');
      await (await getTnInput('netcat_passive_side_connect_address')).setValue('127.0.0.1');
      await (await getTnCheckbox('large_block')).uncheck();
      await (await getTnCheckbox('compressed')).uncheck();

      expect(spectator.component.getPayload()).toEqual({
        ssh_credentials: 1,
        netcat_active_side: 'LOCAL',
        netcat_active_side_listen_address: '0.0.0.0',
        netcat_active_side_port_max: 2000,
        netcat_active_side_port_min: 1000,
        netcat_passive_side_connect_address: '127.0.0.1',
        compressed: false,
        large_block: false,
        speed_limit: null,
      });
    });
  });

  describe('LOCAL transport', () => {
    beforeEach(() => {
      spectator.setInput('transport', TransportMode.Local);
    });

    it('shows defaults for new replication', async () => {
      expect(await (await getTnCheckbox('large_block')).isChecked()).toBe(true);
      expect(await (await getTnCheckbox('compressed')).isChecked()).toBe(true);
    });

    it('shows existing values when editing a replication', async () => {
      spectator.setInput('replication', {
        large_block: false,
        compressed: true,
      } as ReplicationTask);

      expect(await (await getTnCheckbox('large_block')).isChecked()).toBe(false);
      expect(await (await getTnCheckbox('compressed')).isChecked()).toBe(true);
    });

    it('disables Large Blocks checkbox if existing replication has it set to true', async () => {
      spectator.setInput('replication', {
        large_block: true,
      } as ReplicationTask);

      const largeBlockCheckbox = await getTnCheckbox('large_block');
      expect(await largeBlockCheckbox.isDisabled()).toBe(true);
    });

    it('returns payload when getPayload() is called', () => {
      spectator.setInput('replication', {
        large_block: true,
        compressed: true,
      } as ReplicationTask);

      expect(spectator.component.getPayload()).toEqual({
        large_block: true,
        compressed: true,
        netcat_active_side: null,
        netcat_active_side_listen_address: null,
        netcat_active_side_port_max: null,
        netcat_active_side_port_min: null,
        netcat_passive_side_connect_address: null,
        ssh_credentials: null,
      });
    });
  });
});
