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

  it('returns an empty string when contract type is an empty string', () => {
    expect(getLabelForContractType('')).toBe('');
  });

  it('falls back to the raw value for unknown contract types', () => {
    // Future-proofing: middleware may emit values not yet in the enum (e.g. PLATINUM).
    // The effect uppercases unknowns rather than dropping them, so the label helper
    // surfaces the raw string instead of an empty cell.
    expect(getLabelForContractType('PLATINUM')).toBe('PLATINUM');
  });
});
