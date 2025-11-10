import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import {
  ManualDiskDragToggleStore,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-drag-toggle.store';

describe('ManualDiskDragToggleStore', () => {
  let spectator: SpectatorService<ManualDiskDragToggleStore>;

  const createService = createServiceFactory({
    service: ManualDiskDragToggleStore,
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should have default state with dragActive as false', () => {
    expect(spectator.service.state()).toEqual({
      dragActive: false,
    });
  });

  describe('dragActive$ selector', () => {
    it('returns dragActive state', async () => {
      const dragActive = await new Promise<boolean>((resolve) => {
        spectator.service.dragActive$.subscribe((value) => resolve(value));
      });
      expect(dragActive).toBe(false);
    });

    it('emits updated dragActive value after toggle', async () => {
      spectator.service.toggleActivateDrag(true);

      const dragActive = await new Promise<boolean>((resolve) => {
        spectator.service.dragActive$.subscribe((value) => resolve(value));
      });
      expect(dragActive).toBe(true);
    });
  });

  describe('toggleActivateDrag', () => {
    it('sets dragActive to true when called with true', () => {
      spectator.service.toggleActivateDrag(true);

      expect(spectator.service.state()).toEqual({
        dragActive: true,
      });
    });

    it('sets dragActive to false when called with false', () => {
      spectator.service.toggleActivateDrag(true);
      spectator.service.toggleActivateDrag(false);

      expect(spectator.service.state()).toEqual({
        dragActive: false,
      });
    });

    it('can toggle multiple times', () => {
      spectator.service.toggleActivateDrag(true);
      expect(spectator.service.state().dragActive).toBe(true);

      spectator.service.toggleActivateDrag(false);
      expect(spectator.service.state().dragActive).toBe(false);

      spectator.service.toggleActivateDrag(true);
      expect(spectator.service.state().dragActive).toBe(true);
    });
  });
});
