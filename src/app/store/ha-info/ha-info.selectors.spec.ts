import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { HaStatus } from 'app/interfaces/events/ha-status-event.interface';
import { HaInfoState } from 'app/store/ha-info/ha-info.reducer';
import {
  selectCanFailover,
  selectHaInfoState,
  selectHaStatus,
  selectIsHaEnabled,
  selectIsHaLicensed,
} from 'app/store/ha-info/ha-info.selectors';

describe('HaInfo Selectors', () => {
  const initialState: HaInfoState = {
    haStatus: null,
    isHaLicensed: false,
  };

  describe('selectHaInfoState', () => {
    it('should select the haInfo state', () => {
      const state = { haInfo: initialState };
      const result = selectHaInfoState(state);

      expect(result).toBe(initialState);
    });
  });

  describe('selectHaStatus', () => {
    it('should select the haStatus', () => {
      const haStatus: HaStatus = { hasHa: true, reasons: [] };
      const state = { haInfo: { ...initialState, haStatus } };
      const result = selectHaStatus(state);

      expect(result).toBe(haStatus);
    });

    it('should return null when haStatus is null', () => {
      const state = { haInfo: initialState };
      const result = selectHaStatus(state);

      expect(result).toBeNull();
    });
  });

  describe('selectIsHaLicensed', () => {
    it('should return true when HA is licensed', () => {
      const state = { haInfo: { ...initialState, isHaLicensed: true } };
      const result = selectIsHaLicensed(state);

      expect(result).toBe(true);
    });

    it('should return false when HA is not licensed', () => {
      const state = { haInfo: { ...initialState, isHaLicensed: false } };
      const result = selectIsHaLicensed(state);

      expect(result).toBe(false);
    });

    it('should return false when state is undefined', () => {
      const state = { haInfo: undefined as HaInfoState | undefined };
      const result = selectIsHaLicensed(state);

      expect(result).toBe(false);
    });
  });

  describe('selectIsHaEnabled', () => {
    it('should return true when HA is enabled', () => {
      const state = {
        haInfo: {
          ...initialState,
          haStatus: { hasHa: true, reasons: [] } as HaStatus,
        },
      };
      const result = selectIsHaEnabled(state);

      expect(result).toBe(true);
    });

    it('should return false when HA is disabled', () => {
      const state = {
        haInfo: {
          ...initialState,
          haStatus: { hasHa: false, reasons: [FailoverDisabledReason.NoPong] } as HaStatus,
        },
      };
      const result = selectIsHaEnabled(state);

      expect(result).toBe(false);
    });

    it('should return false when haStatus is null', () => {
      const state = { haInfo: initialState };
      const result = selectIsHaEnabled(state);

      expect(result).toBe(false);
    });
  });

  describe('selectCanFailover', () => {
    it('should return true when HA is enabled', () => {
      const state = {
        haInfo: {
          ...initialState,
          haStatus: { hasHa: true, reasons: [] } as HaStatus,
        },
      };
      const result = selectCanFailover(state);

      expect(result).toBe(true);
    });

    it('should return false when haStatus is null', () => {
      const state = { haInfo: initialState };
      const result = selectCanFailover(state);

      expect(result).toBe(false);
    });

    it('should return false when haStatus.reasons is undefined', () => {
      const state = {
        haInfo: {
          ...initialState,
          haStatus: { hasHa: false } as HaStatus,
        },
      };
      const result = selectCanFailover(state);

      expect(result).toBe(false);
    });

    it('should return true when all reasons are allowed', () => {
      const state = {
        haInfo: {
          ...initialState,
          haStatus: {
            hasHa: false,
            reasons: [
              FailoverDisabledReason.MismatchVersions,
              FailoverDisabledReason.LocalFipsRebootRequired,
            ],
          } as HaStatus,
        },
      };
      const result = selectCanFailover(state);

      expect(result).toBe(true);
    });

    it('should return false when any reason is not allowed', () => {
      const state = {
        haInfo: {
          ...initialState,
          haStatus: {
            hasHa: false,
            reasons: [
              FailoverDisabledReason.MismatchVersions,
              FailoverDisabledReason.NoLicense,
            ],
          } as HaStatus,
        },
      };
      const result = selectCanFailover(state);

      expect(result).toBe(false);
    });

    it('should return true when HA is disabled but no reasons provided', () => {
      const state = {
        haInfo: {
          ...initialState,
          haStatus: {
            hasHa: false,
            reasons: [] as FailoverDisabledReason[],
          } as HaStatus,
        },
      };
      const result = selectCanFailover(state);

      expect(result).toBe(true);
    });
  });
});
