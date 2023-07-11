import { MatTooltip } from '@angular/material/tooltip';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent, MockDirective } from 'ng-mocks';
import { KiB, MiB } from 'app/constants/bytes.constant';
import { LinkState } from 'app/enums/network-interface.enum';
import { NetworkInterfaceUpdate } from 'app/interfaces/reporting.interface';
import { TableService } from 'app/modules/entity/table/table.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import {
  InterfaceStatusIconComponent,
} from 'app/pages/network/components/interfaces-card/interface-status-icon/interface-status-icon.component';

describe('InterfaceStatusIconComponent', () => {
  let spectator: Spectator<InterfaceStatusIconComponent>;
  const createComponent = createComponentFactory({
    component: InterfaceStatusIconComponent,
    declarations: [
      MockComponent(IxIconComponent),
      MockDirective(MatTooltip),
    ],
    providers: [
      mockProvider(TableService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  describe('disabled', () => {
    it('shows disabled icon when link state is not Up', () => {
      spectator.setInput('update', {
        link_state: LinkState.Down,
      } as NetworkInterfaceUpdate);

      const icon = spectator.query(IxIconComponent);
      expect(icon.name).toBe('ix:network_upload_download_disabled');
    });

    it('shows disabled icon when link state is not available', () => {
      const icon = spectator.query(IxIconComponent);
      expect(icon.name).toBe('ix:network_upload_download_disabled');
    });
  });

  describe('enabled', () => {
    beforeEach(() => {
      spectator.setInput('update', {
        link_state: LinkState.Up,
        sent_bytes: 100 * KiB,
        sent_bytes_rate: 100 * KiB,
        received_bytes_rate: 20 * MiB,
        received_bytes: 30 * MiB,
      } as NetworkInterfaceUpdate);
    });

    it('shows enabled icon when link state is Up', () => {
      const icon = spectator.query(IxIconComponent);
      expect(icon.name).toBe('ix:network_upload_download');
    });

    it('shows sent and received rate in icon tooltip', () => {
      const tooltip = spectator.query(MatTooltip);

      expect(tooltip.message).toBe('Sent: 100 KiB Received: 30 MiB');
    });

    it('updates state icon to mark arrow or arrows as active on network traffic', () => {
      const tableService = spectator.inject(TableService);
      expect(tableService.updateStateInfoIcon).toHaveBeenCalledWith(expect.any(String), 'sent');
      expect(tableService.updateStateInfoIcon).toHaveBeenCalledWith(expect.any(String), 'received');
    });
  });
});
