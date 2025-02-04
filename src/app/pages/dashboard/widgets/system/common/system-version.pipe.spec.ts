import { Codename } from 'app/enums/codename.enum';
import { SystemVersionPipe } from 'app/pages/dashboard/widgets/system/common/system-version.pipe';

describe('Pipe: SystemVersion', () => {
  it('should return semantic version when no codename is provided', () => {
    const pipe = new SystemVersionPipe();

    expect(pipe.transform('TrueNAS-COMMUNITY_EDITION-24.04.0-MASTER-20250126-184805')).toBe('24.04.0 - Dragonfish');
    expect(pipe.transform('TrueNAS-COMMUNITY_EDITION-24.10.0-MASTER-20250126-184805')).toBe('24.10.0 - ElectricEel');
    expect(pipe.transform('TrueNAS-COMMUNITY_EDITION-25.04.0-MASTER-20250126-184805')).toBe('25.04.0 - Fangtooth');
  });

  it('should return semantic version when valid input is provided', () => {
    const pipe = new SystemVersionPipe();

    expect(pipe.transform('TrueNAS-COMMUNITY_EDITION-24.04.0-MASTER-20250126-184805', Codename.Dragonfish)).toBe('24.04.0 - Dragonfish');
    expect(pipe.transform('TrueNAS-COMMUNITY_EDITION-24.10.0-MASTER-20250126-184805', Codename.ElectricEel)).toBe('24.10.0 - ElectricEel');
    expect(pipe.transform('TrueNAS-COMMUNITY_EDITION-25.04.0-MASTER-20250126-184805', Codename.Fangtooth)).toBe('25.04.0 - Fangtooth');
  });
});
