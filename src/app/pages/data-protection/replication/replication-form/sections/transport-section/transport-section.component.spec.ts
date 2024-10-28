import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { mockWebSocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { NetcatMode } from 'app/enums/netcat-mode.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { KeychainCredential } from 'app/interfaces/keychain-credential.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import {
  SshCredentialsSelectComponent,
} from 'app/modules/forms/custom-selects/ssh-credentials-select/ssh-credentials-select.component';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxFieldsetHarness } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import {
  TransportSectionComponent,
} from 'app/pages/data-protection/replication/replication-form/sections/transport-section/transport-section.component';

describe('TransportSectionComponent', () => {
  let spectator: Spectator<TransportSectionComponent>;
  let loader: HarnessLoader;
  let form: IxFieldsetHarness;
  const createComponent = createComponentFactory({
    component: TransportSectionComponent,
    imports: [
      ReactiveFormsModule,
      SshCredentialsSelectComponent,
    ],
    providers: [
      mockWebSocket([
        mockCall('keychaincredential.query', [
          { id: 1, name: 'connection 1' },
          { id: 2, name: 'connection 2' },
        ] as KeychainCredential[]),
      ]),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(SlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFieldsetHarness);
  });

  describe('SSH transport', () => {
    beforeEach(() => {
      spectator.setInput('transport', TransportMode.Ssh);
    });

    it('shows defaults for new replication', async () => {
      expect(await form.getValues()).toEqual({
        'SSH Connection': '',
        'Stream Compression': 'Disabled',
        'Allow Blocks Larger than 128KB': true,
        'Allow Compressed WRITE Records': true,
        'Limit(Examples: 500 KiB, 500M, 2 TB)': '',
      });
    });

    it('shows existing values when editing a replication', async () => {
      spectator.setInput('replication', {
        ssh_credentials: {
          id: 1,
        },
        compression: null,
        speed_limit: 2 * GiB,
        large_block: true,
        compressed: false,
      } as ReplicationTask);

      expect(await form.getValues()).toEqual({
        'SSH Connection': 'connection 1',
        'Stream Compression': 'Disabled',
        'Limit(Examples: 500 KiB, 500M, 2 TB)': '2 GiB',
        'Allow Blocks Larger than 128KB': true,
        'Allow Compressed WRITE Records': false,
      });
    });

    it('returns payload when getPayload() is called', async () => {
      await form.fillForm({
        'SSH Connection': 'connection 2',
        'Stream Compression': 'lz4 (fastest)',
      });

      expect(spectator.component.getPayload()).toEqual({
        ssh_credentials: 2,
        compression: 'LZ4',
        compressed: true,
        large_block: true,
        netcat_active_side: null,
        netcat_active_side_listen_address: null,
        netcat_active_side_port_max: null,
        netcat_active_side_port_min: null,
        netcat_passive_side_connect_address: null,
      });
    });
  });

  describe('SSH+NETCAT transport', () => {
    beforeEach(() => {
      spectator.setInput('transport', TransportMode.Netcat);
    });

    it('shows defaults for new replication', async () => {
      expect(await form.getValues()).toEqual({
        'SSH Connection': '',
        'Netcat Active Side': 'LOCAL',
        'Netcat Active Side Listen Address': '',
        'Netcat Active Side Min Port': '',
        'Netcat Active Side Max Port': '',
        'Netcat Active Side Connect Address': '',
        'Allow Blocks Larger than 128KB': true,
        'Allow Compressed WRITE Records': true,
      });
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

      expect(await form.getValues()).toEqual({
        'SSH Connection': 'connection 2',
        'Netcat Active Side': 'REMOTE',
        'Netcat Active Side Listen Address': '0.0.0.0',
        'Netcat Active Side Min Port': '1000',
        'Netcat Active Side Max Port': '2000',
        'Netcat Active Side Connect Address': '127.0.0.1',
        'Allow Blocks Larger than 128KB': false,
        'Allow Compressed WRITE Records': true,
      });
    });

    it('returns payload with null fields when getPayload() is called', async () => {
      await form.fillForm({
        'SSH Connection': 'connection 1',
        'Netcat Active Side': 'LOCAL',
        'Netcat Active Side Listen Address': '0.0.0.0',
        'Netcat Active Side Min Port': '1000',
        'Allow Compressed WRITE Records': false,
      });

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
      await form.fillForm({
        'SSH Connection': 'connection 1',
        'Netcat Active Side': 'LOCAL',
        'Netcat Active Side Listen Address': '0.0.0.0',
        'Netcat Active Side Min Port': '1000',
        'Netcat Active Side Max Port': '2000',
        'Netcat Active Side Connect Address': '127.0.0.1',
        'Allow Blocks Larger than 128KB': false,
        'Allow Compressed WRITE Records': false,
      });

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
      expect(await form.getValues()).toEqual({
        'Allow Blocks Larger than 128KB': true,
        'Allow Compressed WRITE Records': true,
      });
    });

    it('shows existing values when editing a replication', async () => {
      spectator.setInput('replication', {
        large_block: false,
        compressed: true,
      } as ReplicationTask);

      expect(await form.getValues()).toEqual({
        'Allow Blocks Larger than 128KB': false,
        'Allow Compressed WRITE Records': true,
      });
    });

    it('disables Large Blocks checkbox if existing replication has it set to true', async () => {
      spectator.setInput('replication', {
        large_block: true,
      } as ReplicationTask);

      const largeBlockCheckbox = await loader.getHarness(
        IxCheckboxHarness.with({ label: 'Allow Blocks Larger than 128KB' }),
      );
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
