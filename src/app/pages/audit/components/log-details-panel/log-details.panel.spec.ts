import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { EventDataDetailsCardComponent } from 'app/pages/audit/components/event-data-details-card/event-data-details-card.component';
import { LogDetailsPanelComponent } from 'app/pages/audit/components/log-details-panel/log-details-panel.component';
import { MetadataDetailsCardComponent } from 'app/pages/audit/components/metadata-details-card/metadata-details-card.component';

describe('LogDetailsPanelComponent', () => {
  let spectator: Spectator<LogDetailsPanelComponent>;
  const createComponent = createComponentFactory({
    component: LogDetailsPanelComponent,
    declarations: [
      MockComponents(
        MetadataDetailsCardComponent,
        EventDataDetailsCardComponent,
      ),
    ],
    providers: [],
    imports: [],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('checks card title', () => {
    const title = spectator.query('h2');
    expect(title).toHaveText('Log Details');
  });

  it('renders ix-metadata-details-card', () => {
    const metadataDetailsCard = spectator.query('ix-metadata-details-card');
    expect(metadataDetailsCard).toBeTruthy();
  });

  it('renders ix-event-data-details-card', () => {
    const eventDataDetailsCard = spectator.query('ix-event-data-details-card');
    expect(eventDataDetailsCard).toBeTruthy();
  });
});
