import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import {
  ExplorerCreateZvolComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-zvol/explorer-create-zvol.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';

describe('ExplorerCreateZvolComponent', () => {
  let spectator: Spectator<ExplorerCreateZvolComponent>;

  const createComponent = createComponentFactory({
    component: ExplorerCreateZvolComponent,
    providers: [
      mockAuth(),
      mockProvider(FormSidePanelService, {
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
    it('opens ZvolFormComponent side panel and emits the created zvol path', async () => {
      const created = await firstValueFrom(spectator.component.create('/dev/zvol/tank'));

      expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(ZvolFormComponent, {
        title: 'Add Zvol',
        inputs: {
          params: {
            isNew: true,
            parentOrZvolId: 'tank',
          },
        },
      });
      expect(created).toBe('/dev/zvol/tank/new-zvol');
    });

    it('emits null when the side panel is cancelled', async () => {
      spectator.inject(FormSidePanelService).open = jest.fn(
        () => SlideInResult.cancel(),
      ) as unknown as FormSidePanelService['open'];

      const created = await firstValueFrom(spectator.component.create('/dev/zvol/tank'));

      expect(created).toBeNull();
    });

    it('emits null without opening the panel when the parent is invalid', async () => {
      const created = await firstValueFrom(spectator.component.create('/mnt/tank'));

      expect(created).toBeNull();
      expect(spectator.inject(FormSidePanelService).open).not.toHaveBeenCalled();
    });
  });
});
