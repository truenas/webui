import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { FilePickerCreateAction } from '@truenas/ui-components';
import { of } from 'rxjs';
import { zvolsRootNode } from 'app/constants/basic-root-nodes.constant';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CreateZvolActionPipe } from 'app/modules/forms/file-picker/create-zvol-action.pipe';
import { TreeNodeSource } from 'app/modules/forms/file-picker/tree-node-source';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';

describe('CreateZvolActionPipe', () => {
  let spectator: SpectatorService<CreateZvolActionPipe>;
  let action: FilePickerCreateAction;

  const source = new TreeNodeSource(() => of([]), [zvolsRootNode], () => undefined);

  const createService = createServiceFactory({
    service: CreateZvolActionPipe,
    providers: [
      mockAuth(),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.success({ id: 'tank/new-zvol' })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    action = spectator.service.transform(source);
  });

  describe('canCreateAt', () => {
    it('allows creation under a dataset inside /dev/zvol', () => {
      expect(action.canCreateAt!('/dev/zvol/tank', null)).toBe(true);
    });

    it('does not allow creation at the /dev/zvol top level', () => {
      expect(action.canCreateAt!('/dev/zvol', null)).toBe(false);
    });

    it('does not allow creation outside of /dev/zvol', () => {
      expect(action.canCreateAt!('/mnt/tank', null)).toBe(false);
    });
  });

  describe('run', () => {
    it('opens ZvolFormComponent side panel and resolves with the created zvol path', async () => {
      const created = await action.run!('/dev/zvol/tank');

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

    it('resolves with null when the side panel is cancelled', async () => {
      spectator.inject(FormSidePanelService).open = jest.fn(
        () => SlideInResult.cancel(),
      ) as unknown as FormSidePanelService['open'];

      expect(await action.run!('/dev/zvol/tank')).toBeNull();
    });

    it('resolves with null without opening the panel when the parent is invalid', async () => {
      expect(await action.run!('/mnt/tank')).toBeNull();
      expect(spectator.inject(FormSidePanelService).open).not.toHaveBeenCalled();
    });
  });
});
