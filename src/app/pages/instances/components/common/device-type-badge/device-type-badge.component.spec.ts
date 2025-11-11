import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { ContainerDeviceType } from 'app/enums/container.enum';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { DeviceTypeBadgeComponent } from './device-type-badge.component';

describe('DeviceTypeBadgeComponent', () => {
  let spectator: Spectator<DeviceTypeBadgeComponent>;
  const createComponent = createComponentFactory({
    component: DeviceTypeBadgeComponent,
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

  it('should display icon for USB device type', () => {
    spectator = createComponent({
      props: {
        deviceType: ContainerDeviceType.Usb,
      },
    });

    const icon = spectator.query(IxIconComponent);
    expect(icon).toBeTruthy();
    expect(icon.name()).toBe('usb');
  });

  it('should display icon for NIC device type', () => {
    spectator = createComponent({
      props: {
        deviceType: ContainerDeviceType.Nic,
      },
    });

    const icon = spectator.query(IxIconComponent);
    expect(icon).toBeTruthy();
    expect(icon.name()).toBe('device_hub');
  });

  it('should display label when showLabel is true', () => {
    spectator = createComponent({
      props: {
        deviceType: ContainerDeviceType.Filesystem,
        showLabel: true,
      },
    });

    expect(spectator.query('.device-label')).toBeTruthy();
  });

  it('should hide label when showLabel is false', () => {
    spectator = createComponent({
      props: {
        deviceType: ContainerDeviceType.Filesystem,
        showLabel: false,
      },
    });

    expect(spectator.query('.device-label')).toBeFalsy();
  });

  it('should apply correct CSS class for FILESYSTEM device', () => {
    spectator = createComponent({
      props: {
        deviceType: ContainerDeviceType.Filesystem,
      },
    });

    expect(spectator.query('.device-filesystem')).toBeTruthy();
  });

  it('should apply correct CSS class for USB device', () => {
    spectator = createComponent({
      props: {
        deviceType: ContainerDeviceType.Usb,
      },
    });

    expect(spectator.query('.device-usb')).toBeTruthy();
  });

  it('should apply correct CSS class for NIC device', () => {
    spectator = createComponent({
      props: {
        deviceType: ContainerDeviceType.Nic,
      },
    });

    expect(spectator.query('.device-nic')).toBeTruthy();
  });
});
