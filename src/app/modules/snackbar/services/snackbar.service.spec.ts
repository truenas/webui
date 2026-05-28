import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import {
  TnToastMock, TnToastTesting, TnToastType,
} from '@truenas/ui-components';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';

describe('SnackbarService', () => {
  let spectator: SpectatorService<SnackbarService>;
  const toast = new TnToastMock();

  const createService = createServiceFactory({
    service: SnackbarService,
    providers: [
      TnToastTesting.providers(toast),
    ],
  });

  beforeEach(() => {
    toast.reset();
    spectator = createService();
  });

  describe('success', () => {
    it('opens a success toast at the top', () => {
      spectator.service.success(ignoreTranslation('All good'));

      expect(toast.calls).toHaveLength(1);
      expect(toast.lastCall?.message).toBe('All good');
      expect(toast.lastCall?.config).toEqual({
        type: TnToastType.Success,
        duration: 4000,
      });
    });
  });

  describe('error', () => {
    it('opens an error toast with a Close action', () => {
      spectator.service.error(ignoreTranslation('Something broke'));

      expect(toast.lastCall?.message).toBe('Something broke');
      expect(toast.lastCall?.action).toBe('Close');
      expect(toast.lastCall?.config.type).toBe(TnToastType.Error);
    });

    it('dismisses the toast when Close is triggered', () => {
      const ref = spectator.service.error(ignoreTranslation('Boom'));
      const dismissSpy = jest.spyOn(ref, 'dismiss');

      toast.lastCall?.ref._triggerAction();

      expect(dismissSpy).toHaveBeenCalled();
    });
  });

  describe('open', () => {
    it('maps SnackbarOptions to a tn-toast call and runs the action', () => {
      const action = jest.fn();
      spectator.service.open({
        message: ignoreTranslation('Heads up'),
        type: TnToastType.Warning,
        duration: 5000,
        button: { title: ignoreTranslation('Undo'), action },
      });

      expect(toast.lastCall?.message).toBe('Heads up');
      expect(toast.lastCall?.action).toBe('Undo');
      expect(toast.lastCall?.config).toEqual({
        type: TnToastType.Warning,
        duration: 5000,
      });

      toast.lastCall?.ref._triggerAction();
      expect(action).toHaveBeenCalled();
    });

    it('passes the requested toast type through', () => {
      spectator.service.open({
        message: ignoreTranslation('Red alert'),
        type: TnToastType.Error,
      });

      expect(toast.lastCall?.config.type).toBe(TnToastType.Error);
    });

    it('defaults to info type when no type is provided', () => {
      spectator.service.open({ message: ignoreTranslation('FYI') });

      expect(toast.lastCall?.config.type).toBe(TnToastType.Info);
    });
  });

  describe('dismiss', () => {
    it('dismisses the most recent toast', () => {
      const ref = spectator.service.success(ignoreTranslation('Saved'));
      const dismissSpy = jest.spyOn(ref, 'dismiss');

      spectator.service.dismiss();

      expect(dismissSpy).toHaveBeenCalled();
    });

    it('stops tracking a toast once it dismisses on its own', () => {
      const firstRef = spectator.service.success(ignoreTranslation('Saved'));
      firstRef.dismiss();
      const firstDismissSpy = jest.spyOn(firstRef, 'dismiss');

      spectator.service.dismiss();

      // The stale ref must not be re-dismissed; only a live toast should be.
      expect(firstDismissSpy).not.toHaveBeenCalled();
    });
  });
});
