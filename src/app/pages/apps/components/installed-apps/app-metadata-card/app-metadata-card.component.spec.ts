import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { AppMetadataCardComponent } from './app-notes-card.component';

describe('AppMetadataCardComponent', () => {
  let spectator: Spectator<AppMetadataCardComponent>;

  const app = {
    id: 'ix-test-app',
    name: 'test-app',
    chart_metadata: {
      name: 'rude-cardinal',
    },
    update_available: true,
  } as ChartRelease;

  const createComponent = createComponentFactory({
    component: AppMetadataCardComponent,
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
    expect(spectator.query('mat-card-header h3')).toHaveText('Application Metadata');
  });

  it('shows a table with hostMounts', () => {
    const notes = spectator.queryAll('.notes-item');
    expect(notes).toHaveLength(4);

    expect(notes[0]).toHaveText('Thank you for installing test-app');
  });
});
