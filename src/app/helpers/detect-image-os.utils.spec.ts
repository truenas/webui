import { ImageOs } from 'app/enums/virtualization.enum';
import { detectImageOs } from 'app/helpers/detect-image-os.utils';

describe('detectImageOs', () => {
  it('returns null for null or undefined or empty string', () => {
    expect(detectImageOs(null)).toBeNull();
    expect(detectImageOs(undefined)).toBeNull();
    expect(detectImageOs('')).toBeNull();
  });

  it('detects Windows OS', () => {
    expect(detectImageOs('win10')).toBe(ImageOs.Windows);
    expect(detectImageOs('Windows Server')).toBe(ImageOs.Windows);
    expect(detectImageOs('my_windows_image')).toBe(ImageOs.Windows);
  });

  it('detects Linux OS', () => {
    expect(detectImageOs('ubuntu-22.04')).toBe(ImageOs.Linux);
    expect(detectImageOs('debian_x64')).toBe(ImageOs.Linux);
    expect(detectImageOs('my-centos-template')).toBe(ImageOs.Linux);
    expect(detectImageOs('archlinux')).toBe(ImageOs.Linux);
  });

  it('detects FreeBSD OS', () => {
    expect(detectImageOs('FreeBSD 13.1')).toBe(ImageOs.FreeBsd);
    expect(detectImageOs('free bsd minimal')).toBe(ImageOs.FreeBsd);
    expect(detectImageOs('custom-bsd-image')).toBe(ImageOs.FreeBsd);
  });

  it('returns null when no known OS keyword is matched', () => {
    expect(detectImageOs('customOS-xyz')).toBeNull();
    expect(detectImageOs('macos-big-sur')).toBeNull();
  });
});
