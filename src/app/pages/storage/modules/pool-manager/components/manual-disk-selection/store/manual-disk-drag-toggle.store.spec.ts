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

  it('starts with dragging inactive', () => {
    expect(spectator.service.dragActive()).toBe(false);
  });

  it('toggleActivateDrag sets whether a drag is in progress', () => {
    spectator.service.toggleActivateDrag(true);
    expect(spectator.service.dragActive()).toBe(true);

    spectator.service.toggleActivateDrag(false);
    expect(spectator.service.dragActive()).toBe(false);
  });
});
