import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { ContainerDeviceType } from 'app/enums/container.enum';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { DeviceTypeBadgeComponent } from './device-type-badge.component';

describe('DeviceTypeBadgeComponent', () => {
  let spectator: Spectator<DeviceTypeBadgeComponent>;
  const createComponent = createComponentFactory({
    component: DeviceTypeBadgeComponent,
  });

  it('should display icon for DISK device type', () => {
    spectator = createComponent({
      props: {
        deviceType: ContainerDeviceType.Disk,
      },
    });

    const icon = spectator.query(IxIconComponent);
    expect(icon).toBeTruthy();
    expect(icon.name()).toBe('mdi-harddisk');
  });

  it('should display icon for RAW device type', () => {
    spectator = createComponent({
      props: {
        deviceType: ContainerDeviceType.Raw,
      },
    });

    const icon = spectator.query(IxIconComponent);
    expect(icon).toBeTruthy();
    expect(icon.name()).toBe('mdi-file-document');
  });

  it('should display icon for FILESYSTEM device type', () => {
    spectator = createComponent({
      props: {
        deviceType: ContainerDeviceType.Filesystem,
      },
    });

    const icon = spectator.query(IxIconComponent);
    expect(icon).toBeTruthy();
    expect(icon.name()).toBe('mdi-folder');
  });

  it('should display label when showLabel is true', () => {
    spectator = createComponent({
      props: {
        deviceType: ContainerDeviceType.Disk,
        showLabel: true,
      },
    });

    expect(spectator.query('.device-label')).toBeTruthy();
  });

  it('should hide label when showLabel is false', () => {
    spectator = createComponent({
      props: {
        deviceType: ContainerDeviceType.Disk,
        showLabel: false,
      },
    });

    expect(spectator.query('.device-label')).toBeFalsy();
  });

  it('should apply correct CSS class for DISK device', () => {
    spectator = createComponent({
      props: {
        deviceType: ContainerDeviceType.Disk,
      },
    });

    expect(spectator.query('.device-disk')).toBeTruthy();
  });

  it('should apply correct CSS class for RAW device', () => {
    spectator = createComponent({
      props: {
        deviceType: ContainerDeviceType.Raw,
      },
    });

    expect(spectator.query('.device-raw')).toBeTruthy();
  });

  it('should apply correct CSS class for FILESYSTEM device', () => {
    spectator = createComponent({
      props: {
        deviceType: ContainerDeviceType.Filesystem,
      },
    });

    expect(spectator.query('.device-filesystem')).toBeTruthy();
  });
});
