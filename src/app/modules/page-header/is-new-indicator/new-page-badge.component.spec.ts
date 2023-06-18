import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { FeedbackDialogComponent } from 'app/modules/ix-feedback/feedback-dialog/feedback-dialog.component';
import { NewPageBadgeComponent } from 'app/modules/page-header/is-new-indicator/new-page-badge.component';

describe('IsNewIndicator', () => {
  let spectator: Spectator<NewPageBadgeComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: NewPageBadgeComponent,
    imports: [],
    providers: [
      mockProvider(MatDialog),
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
