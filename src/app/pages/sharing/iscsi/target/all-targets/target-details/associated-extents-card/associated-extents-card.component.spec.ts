import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AssociatedTargetFormComponent } from 'app/pages/sharing/iscsi/target/all-targets/target-details/associated-extents-card/associated-target-form/associated-target-form.component';
import { IscsiService } from 'app/services/iscsi.service';
import { AssociatedExtentsCardComponent } from './associated-extents-card.component';

describe('AssociatedExtentsCardComponent', () => {
  let spectator: Spectator<AssociatedExtentsCardComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: AssociatedExtentsCardComponent,
    imports: [
      MatCardModule,
      MatButtonModule,
      IxIconComponent,
      TranslateModule.forRoot(),
      NgxSkeletonLoaderModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(IscsiService, {
        getExtents: jest.fn(() => of([
          { id: 1, name: 'Extent 1', path: '/path/to/extent1' },
          { id: 2, name: 'Extent 2', path: '/path/to/extent2' },
        ])),
        getTargetExtents: jest.fn(() => of([
          {
            id: 1, extent: 1, target: 1, lunid: 0,
          },
        ])),
        deleteTargetExtent: jest.fn(() => of(null)),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        target: {
          id: 1,
          name: 'Test Target',
        } as IscsiTarget,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    spectator.detectChanges();
  });

  it('shows loading skeletons while extents are loading', () => {
    spectator.setInput('target', { id: 1, name: 'Test Target' });
    spectator.component.isLoadingExtents.set(true);
    spectator.detectChanges();

    expect(spectator.query('ngx-skeleton-loader')).toBeVisible();
  });

  it('opens associate target dialog when "Associate" button is clicked', async () => {
    const matDialog = spectator.inject(MatDialog);
    const spy = jest.spyOn(matDialog, 'open');

    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Associate' }));
    await button.click();

    expect(spy).toHaveBeenCalledWith(AssociatedTargetFormComponent, {
      data: {
        target: { id: 1, name: 'Test Target' },
        extents: [{ id: 2, name: 'Extent 2', path: '/path/to/extent2' }],
      },
    });
  });

  it('displays mapped extents', () => {
    spectator.component.isLoadingExtents.set(false);

    const mappedExtent = spectator.query('.mapped-extent');
    expect(mappedExtent).toBeVisible();
    expect(mappedExtent).toHaveText('LUN ID: 0 | Extent 1 | /path/to/extent1');
  });

  it('removes extent association when "Remove" button is clicked', async () => {
    const dialogService = spectator.inject(DialogService);
    const iscsiService = spectator.inject(IscsiService);
    const confirmSpy = jest.spyOn(dialogService, 'confirm');
    const deleteSpy = jest.spyOn(iscsiService, 'deleteTargetExtent');

    const button = await loader.getHarness(MatButtonHarness.with({
      selector: '[aria-label="Remove extent association"]',
    }));
    await button.click();

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteSpy).toHaveBeenCalledWith(1);
  });

  it('displays "No extents associated" when no mapped extents exist', () => {
    spectator.setInput('target', { id: 2, name: 'Empty Target' });
    spectator.component.targetExtents.set([]);

    expect(spectator.query('p')).toHaveText('No extents associated.');
  });
});
