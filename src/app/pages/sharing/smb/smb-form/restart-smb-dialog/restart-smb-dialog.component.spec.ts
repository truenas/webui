import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnIconHarness } from '@truenas/ui-components';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { RestartSmbDialog } from './restart-smb-dialog.component';

describe('RestartSmbDialog', () => {
  let spectator: Spectator<RestartSmbDialog>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: RestartSmbDialog,
    providers: [
      mockProvider(MatDialogRef),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows restart message and prompt', () => {
    expect(spectator.query('mat-dialog-content')).toContainText(
      'Changes to the SMB share configuration may not fully apply to existing SMB client sessions until the SMB service restarts.',
    );
    expect(spectator.query('mat-dialog-content')).toContainText(
      'Do you want to restart the SMB service now?',
    );
    expect(spectator.query('mat-dialog-content')).toContainText(
      'CAUTION: Restarting the SMB service causes a short service interruption for all connected SMB clients.',
    );
  });

  it('has No and Restart Service buttons', async () => {
    const noButton = await loader.getHarness(MatButtonHarness.with({ text: 'No' }));
    const restartButton = await loader.getHarness(MatButtonHarness.with({ text: 'Restart Service' }));

    expect(noButton).toBeTruthy();
    expect(restartButton).toBeTruthy();
  });

  it('shows learn more link with collapsed state initially', async () => {
    const learnMoreLink = spectator.query('.learn-more-link');
    expect(learnMoreLink).toContainText('Learn more');
    expect(learnMoreLink).toHaveAttribute('aria-expanded', 'false');

    const icon = await loader.getHarness(TnIconHarness.with({ ancestor: '.learn-more-link' }));
    expect(await icon.getName()).toBe('chevron-down');
  });

  it('does not show learn more content initially', () => {
    expect(spectator.query('.learn-more-content')).not.toExist();
  });

  it('expands learn more content when clicked', async () => {
    const learnMoreLink = spectator.query('.learn-more-link');
    spectator.click(learnMoreLink);
    spectator.detectChanges();

    expect(learnMoreLink).toHaveAttribute('aria-expanded', 'true');
    expect(spectator.query('.learn-more-content')).toExist();

    const icon = await loader.getHarness(TnIconHarness.with({ ancestor: '.learn-more-link' }));
    expect(await icon.getName()).toBe('chevron-up');
  });

  it('shows examples in learn more content', () => {
    spectator.click('.learn-more-link');
    spectator.detectChanges();

    const content = spectator.query('.learn-more-content');
    expect(content).toContainText('Time Machine settings');
    expect(content).toContainText('Hosts Allow/Deny');
    expect(content).toContainText('Path changes');
  });

  it('collapses learn more content when clicked again', async () => {
    const learnMoreLink = spectator.query('.learn-more-link');

    spectator.click(learnMoreLink);
    spectator.detectChanges();
    expect(spectator.query('.learn-more-content')).toExist();

    spectator.click(learnMoreLink);
    spectator.detectChanges();
    expect(spectator.query('.learn-more-content')).not.toExist();

    const icon = await loader.getHarness(TnIconHarness.with({ ancestor: '.learn-more-link' }));
    expect(await icon.getName()).toBe('chevron-down');
  });

  it('toggles learn more on Enter keypress', () => {
    const learnMoreLink = spectator.query('.learn-more-link');

    spectator.dispatchKeyboardEvent(learnMoreLink, 'keydown', 'Enter');
    spectator.detectChanges();

    expect(spectator.query('.learn-more-content')).toExist();
  });
});
