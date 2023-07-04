import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { MarkdownModule } from 'ngx-markdown';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { AppSectionExpandCollapseComponent } from 'app/pages/apps/components/app-section-expand-collapse/app-section-expand-collapse.component';
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
    info: {
      notes: `
      # Welcome to TrueNAS SCALE
      Thank you for installing MinIO App.
      # Documentation
      Documentation for this app can be found at https://docs.ixsystems.com.
      # Bug reports
      If you find a bug in this app, please file an issue at https://jira.ixsystems.com
      `,
    },
  } as ChartRelease;

  const createComponent = createComponentFactory({
    component: AppNotesCardComponent,
    declarations: [
      AppSectionExpandCollapseComponent,
    ],
    imports: [
      MarkdownModule.forRoot(),
    ],
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

  it('shows titles', () => {
    const titles = spectator.queryAll('.notes-list h1');
    expect(titles).toHaveLength(3);

    expect(titles[0]).toHaveText('Welcome to TrueNAS SCALE');
    expect(titles[1]).toHaveText('Documentation');
    expect(titles[2]).toHaveText('Bug reports');
  });

  it('shows paragraphs', () => {
    const paragraphs = spectator.queryAll('.notes-list p');
    expect(paragraphs).toHaveLength(3);

    expect(paragraphs[0]).toHaveText('Thank you for installing MinIO App.');
    expect(paragraphs[1]).toHaveText('Documentation for this app can be found at https://docs.ixsystems.com.');
    expect(paragraphs[2]).toHaveText('If you find a bug in this app, please file an issue at https://jira.ixsystems.com');
  });
});
