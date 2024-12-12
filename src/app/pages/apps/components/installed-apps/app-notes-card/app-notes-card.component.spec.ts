import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { MarkdownModule } from 'ngx-markdown';
import { App, ChartFormValue } from 'app/interfaces/app.interface';
import { CardExpandCollapseComponent } from 'app/modules/card-expand-collapse/card-expand-collapse.component';
import { AppNotesCardComponent } from './app-notes-card.component';

describe('AppNotesCardComponent', () => {
  let spectator: Spectator<AppNotesCardComponent>;
  const existingAppEdit = {
    name: 'app-name',
    id: 'app_name',
    config: {
      maizeEnabled: true,
      release_name: 'app_name',
      timezone: 'America/Los_Angeles',
    } as Record<string, ChartFormValue>,
    metadata: {},
    notes: `
      # Welcome to TrueNAS SCALE
      Thank you for installing MinIO App.
      # Documentation
      Documentation for this app can be found at https://docs.ixsystems.com.
      # Bug reports
      If you find a bug in this app, please file an issue at https://jira.ixsystems.com
    `,
    version_details: {
      schema: {
        groups: [
          { name: 'Machinaris Configuration' },
        ],
        questions: [
          {
            variable: 'timezone',
            group: 'Machinaris Configuration',
            schema: {
              type: 'string',
              enum: [{ value: 'America/Los_Angeles', description: "'America/Los_Angeles' timezone" }],
              default: 'America/Los_Angeles',
            },
          },
        ],
      },
    },
  } as App;

  const createComponent = createComponentFactory({
    component: AppNotesCardComponent,
    imports: [
      MarkdownModule.forRoot(),
      CardExpandCollapseComponent,
    ],
  });

  beforeEach(() => {
    // Expected sanitizer warnings (because of newlines).
    jest.spyOn(console, 'warn').mockImplementation();

    spectator = createComponent({
      props: {
        app: existingAppEdit,
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
