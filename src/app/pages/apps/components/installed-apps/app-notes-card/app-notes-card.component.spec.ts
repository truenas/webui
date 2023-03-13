import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { AppNotesCardComponent } from './app-notes-card.component';

describe('AppNotesCardComponent', () => {
  let spectator: Spectator<AppNotesCardComponent>;

  const app = {
    id: 'ix-test-app',
    name: 'test-app',
    chart_metadata: {
      name: 'rude-cardinal',
    },
    update_available: true,
  } as ChartRelease;

  const createComponent = createComponentFactory({
    component: AppNotesCardComponent,
    declarations: [],
    providers: [],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        app,
      },
    });
  });

  it('shows header', () => {
    expect(spectator.query('mat-card-header h3')).toHaveText('Notes');
  });

  it('shows notes', () => {
    const notes = spectator.queryAll('.notes-item');
    expect(notes).toHaveLength(4);

    expect(notes[0]).toHaveText('Thank you for installing test-app');
    expect(notes[1]).toHaveText('Your release is named rude-cardinal');
    expect(notes[2]).toHaveText('To learn more about the release, try:');
    expect(notes[3]).toHaveText('$ mychart cli command');
  });
});
