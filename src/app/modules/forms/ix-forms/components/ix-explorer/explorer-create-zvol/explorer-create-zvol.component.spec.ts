import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import {
  ExplorerCreateZvolComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-zvol/explorer-create-zvol.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';

describe('ExplorerCreateZvolComponent', () => {
  let spectator: Spectator<ExplorerCreateZvolComponent>;

  const createComponent = createComponentFactory({
    component: ExplorerCreateZvolComponent,
    providers: [
      mockAuth(),
      mockProvider(SlideIn, {
        open: jest.fn(() => SlideInResult.success({ id: 'tank/new-zvol' })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('allows creation for users with DatasetWrite role', () => {
    expect(spectator.component.canCreate()).toBe(true);
  });

  describe('canCreateAt', () => {
    it('allows creation under a dataset inside /dev/zvol', () => {
      expect(spectator.component.canCreateAt('/dev/zvol/tank')).toBe(true);
    });

    it('does not allow creation at the /dev/zvol top level', () => {
      expect(spectator.component.canCreateAt('/dev/zvol')).toBe(false);
    });

    it('does not allow creation outside of /dev/zvol', () => {
      expect(spectator.component.canCreateAt('/mnt/tank')).toBe(false);
    });
  });

  describe('create', () => {
    it('opens ZvolFormComponent slide-in and emits the created zvol path', async () => {
      const created = await firstValueFrom(spectator.component.create('/dev/zvol/tank'));

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(ZvolFormComponent, {
        data: {
          isNew: true,
          parentOrZvolId: 'tank',
        },
      });
      expect(created).toBe('/dev/zvol/tank/new-zvol');
    });

    it('emits null when the slide-in is cancelled', async () => {
      spectator.inject(SlideIn).open = jest.fn(() => SlideInResult.cancel()) as unknown as SlideIn['open'];

      const created = await firstValueFrom(spectator.component.create('/dev/zvol/tank'));

      expect(created).toBeNull();
    });
  });
});
