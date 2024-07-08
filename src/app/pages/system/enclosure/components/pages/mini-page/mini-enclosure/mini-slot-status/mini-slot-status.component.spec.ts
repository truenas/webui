import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { EnclosureDiskStatus } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import {
  MiniSlotStatusComponent,
} from 'app/pages/system/enclosure/components/pages/mini-page/mini-enclosure/mini-slot-status/mini-slot-status.component';

describe('MiniSlotStatusComponent', () => {
  let spectator: Spectator<MiniSlotStatusComponent>;
  const createComponent = createComponentFactory({
    component: MiniSlotStatusComponent,
    shallow: true,
    imports: [
      MapValuePipe,
    ],
  });

  it('shows an empty icon for an empty slot', () => {
    spectator = createComponent({
      props: {
        slot: {} as DashboardEnclosureSlot,
      },
    });

    expect(spectator.query('ix-icon')).toHaveAttribute('name', 'mdi-circle-outline');
    expect(spectator.query('ix-icon')).toHaveClass('status-empty');
    expect(spectator.fixture.nativeElement).toHaveText('Empty');
  });

  it('shows the correct icon and class for Online status', () => {
    spectator = createComponent({
      props: {
        slot: {
          pool_info: {
            disk_status: EnclosureDiskStatus.Online,
          },
        } as DashboardEnclosureSlot,
      },
    });

    expect(spectator.query('ix-icon')).toHaveAttribute('name', 'check_circle');
    expect(spectator.query('ix-icon')).toHaveClass('status-online');
    expect(spectator.fixture.nativeElement).toHaveText('Online');
  });

  it('shows the correct icon and class for Faulted status', () => {
    spectator = createComponent({
      props: {
        slot: {
          pool_info: {
            disk_status: EnclosureDiskStatus.Faulted,
          },
        } as DashboardEnclosureSlot,
      },
    });

    expect(spectator.query('ix-icon')).toHaveAttribute('name', 'error');
    expect(spectator.query('ix-icon')).toHaveClass('status-faulted');
    expect(spectator.fixture.nativeElement).toHaveText('Faulted');
  });

  it('shows the correct icon and class for Degraded status', () => {
    spectator = createComponent({
      props: {
        slot: {
          pool_info: {
            disk_status: EnclosureDiskStatus.Degraded,
          },
        } as DashboardEnclosureSlot,
      },
    });

    expect(spectator.query('ix-icon')).toHaveAttribute('name', 'error');
    expect(spectator.query('ix-icon')).toHaveClass('status-degraded');
    expect(spectator.fixture.nativeElement).toHaveText('Degraded');
  });

  it('shows the correct icon and class for Unknown status', () => {
    spectator = createComponent({
      props: {
        slot: {
          pool_info: {
            disk_status: EnclosureDiskStatus.Unknown,
          },
        } as DashboardEnclosureSlot,
      },
    });

    expect(spectator.query('ix-icon')).toHaveAttribute('name', 'mdi-help-circle');
    expect(spectator.query('ix-icon')).toHaveClass('status-unknown');
    expect(spectator.fixture.nativeElement).toHaveText('Unknown');
  });

  it('shows the correct icon and class for Offline status', () => {
    spectator = createComponent({
      props: {
        slot: {
          pool_info: {
            disk_status: EnclosureDiskStatus.Offline,
          },
        } as DashboardEnclosureSlot,
      },
    });

    expect(spectator.query('ix-icon')).toHaveAttribute('name', 'mdi-minus-circle');
    expect(spectator.query('ix-icon')).toHaveClass('status-offline');
    expect(spectator.fixture.nativeElement).toHaveText('Offline');
  });
});
