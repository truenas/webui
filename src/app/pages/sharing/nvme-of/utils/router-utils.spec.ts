import { Location } from '@angular/common';
import { setSubsystemNameInUrl } from 'app/pages/sharing/nvme-of/utils/router-utils';

describe('setSubsystemNameInUrl', () => {
  let location: Location;

  beforeEach(() => {
    location = {
      replaceState: jest.fn(),
    } as unknown as Location;
  });

  it('should set encoded subsystem name in the URL when name is provided', () => {
    setSubsystemNameInUrl(location, 'nvme subsystem 1');

    expect(location.replaceState).toHaveBeenCalledWith('sharing/nvme-of/nvme%20subsystem%201');
  });

  it('should set base URL when name is null', () => {
    setSubsystemNameInUrl(location, null);

    expect(location.replaceState).toHaveBeenCalledWith('sharing/nvme-of');
  });

  it('should set base URL when name is empty string', () => {
    setSubsystemNameInUrl(location, '');

    expect(location.replaceState).toHaveBeenCalledWith('sharing/nvme-of');
  });
});
