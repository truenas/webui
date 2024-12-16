import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { IfNightlyDirective } from 'app/directives/if-nightly/if-nightly.directive';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { FeedbackDialogComponent } from 'app/modules/feedback/components/feedback-dialog/feedback-dialog.component';
import { HeaderBadgeComponent } from 'app/modules/page-header/header-badge/header-badge.component';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

describe('HeaderBadgeComponent', () => {
  let spectator: Spectator<HeaderBadgeComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: HeaderBadgeComponent,
    imports: [
      IfNightlyDirective,
    ],
    providers: [
      mockProvider(MatDialog),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemInfo,
            value: {
              version: 'MASTER',
            } as SystemInfo,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('shows new indicator', () => {
    it('shows new indicator and leave feedback text', () => {
      expect(spectator.query('span')).toHaveText('NEW');
      expect(spectator.query('button')).toHaveText('Leave Feedback');
    });

    it('shows leave feedback modal once feedback text pressed', async () => {
      const button = await loader.getHarness(MatButtonHarness.with({ text: 'Leave Feedback' }));
      await button.click();
      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(FeedbackDialogComponent);
    });
  });
});
