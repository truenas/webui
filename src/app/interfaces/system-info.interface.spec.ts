import { ContractType, getLabelForContractType } from './system-info.interface';

describe('getLabelForContractType', () => {
  it('returns the human-readable label for a known contract type', () => {
    expect(getLabelForContractType(ContractType.Gold)).toBe('Gold');
    expect(getLabelForContractType(ContractType.SilverInternational)).toBe('Silver International');
    expect(getLabelForContractType(ContractType.FreeNasMini)).toBe('Free NAS Mini');
  });

  it('returns an empty string when contract type is null', () => {
    expect(getLabelForContractType(null)).toBe('');
  });

  it('returns an empty string when contract type is undefined', () => {
    expect(getLabelForContractType(undefined)).toBe('');
  });
});
