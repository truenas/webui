import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
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
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        log: {} as AuditEntry,
      },
    });
  });

  it('renders Log Details Cards', () => {
    expect(spectator.query(MetadataDetailsCardComponent)).toExist();
    expect(spectator.query(EventDataDetailsCardComponent)).toExist();
  });
});
