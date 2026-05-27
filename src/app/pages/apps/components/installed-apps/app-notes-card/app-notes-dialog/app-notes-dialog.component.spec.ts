import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnDialogHarness } from '@truenas/ui-components';
import { MarkdownModule } from 'ngx-markdown';
import {
  AppNotesDialog,
  AppNotesDialogData,
} from 'app/pages/apps/components/installed-apps/app-notes-card/app-notes-dialog/app-notes-dialog.component';

describe('AppNotesDialog', () => {
  let spectator: Spectator<AppNotesDialog>;
  let loader: HarnessLoader;

  const data: AppNotesDialogData = {
    name: 'netdata',
    notes: '# Heading\n\nSome body text.',
  };

  const createComponent = createComponentFactory({
    component: AppNotesDialog,
    imports: [
      MarkdownModule.forRoot(),
    ],
    providers: [
      mockProvider(DialogRef),
      { provide: DIALOG_DATA, useValue: data },
    ],
  });

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation();
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('titles the dialog shell with the app name', async () => {
    const dialog = await loader.getHarness(TnDialogHarness);

    expect(await dialog.getTitle()).toBe('netdata Notes');
  });

  it('renders the notes as markdown inside the dialog shell', async () => {
    const dialog = await loader.getHarness(TnDialogHarness);
    const content = await dialog.getContentText();

    expect(content).toContain('Heading');
    expect(content).toContain('Some body text.');
  });

  it('closes the dialog when the Close action is clicked', async () => {
    const dialogRef = spectator.inject(DialogRef);
    const dialog = await loader.getHarness(TnDialogHarness);

    await dialog.clickActionButton('Close');

    expect(dialogRef.close).toHaveBeenCalled();
  });
});
