import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { HaStatus } from 'app/interfaces/events/ha-status-event.interface';
import {
  failoverLicensedStatusLoaded,
  haStatusLoaded,
} from 'app/store/ha-info/ha-info.actions';
import { haInfoReducer, HaInfoState } from 'app/store/ha-info/ha-info.reducer';

describe('haInfoReducer', () => {
  const initialState: HaInfoState = {
    haStatus: null,
    isHaLicensed: false,
  };

  it('should return the initial state', () => {
    const action = { type: 'Unknown' };
    const state = haInfoReducer(initialState, action);

    expect(state).toBe(initialState);
  });

  describe('haStatusLoaded', () => {
    it('should update haStatus when haStatusLoaded is dispatched', () => {
      const haStatus: HaStatus = {
        hasHa: true,
        reasons: [],
      };
      const action = haStatusLoaded({ haStatus });
      const state = haInfoReducer(initialState, action);

      expect(state).toEqual({
        ...initialState,
        haStatus,
      });
    });

    it('should handle haStatus with disabled reasons', () => {
      const haStatus: HaStatus = {
        hasHa: false,
        reasons: [FailoverDisabledReason.NoPong, FailoverDisabledReason.NoFailover],
      };
      const action = haStatusLoaded({ haStatus });
      const state = haInfoReducer(initialState, action);

      expect(state).toEqual({
        ...initialState,
        haStatus,
      });
    });
  });

  describe('failoverLicensedStatusLoaded', () => {
    it('should update isHaLicensed to true when licensed', () => {
      const action = failoverLicensedStatusLoaded({ isHaLicensed: true });
      const state = haInfoReducer(initialState, action);

      expect(state).toEqual({
        ...initialState,
        isHaLicensed: true,
      });
    });

    it('should update isHaLicensed to false when not licensed', () => {
      const action = failoverLicensedStatusLoaded({ isHaLicensed: false });
      const state = haInfoReducer(initialState, action);

      expect(state).toEqual({
        ...initialState,
        isHaLicensed: false,
      });
    });

    it('should preserve existing haStatus when updating license status', () => {
      const existingState: HaInfoState = {
        haStatus: { hasHa: true, reasons: [] },
        isHaLicensed: false,
      };
      const action = failoverLicensedStatusLoaded({ isHaLicensed: true });
      const state = haInfoReducer(existingState, action);

      expect(state).toEqual({
        haStatus: { hasHa: true, reasons: [] },
        isHaLicensed: true,
      });
    });
  });
});
