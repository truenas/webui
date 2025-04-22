import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { DetailsItemComponent } from 'app/modules/details-table/details-item/details-item.component';
import { DetailsTableComponent } from 'app/modules/details-table/details-table.component';

describe('DetailsTableComponent', () => {
  let spectator: SpectatorHost<DetailsTableComponent>;
  const createHost = createHostFactory({
    component: DetailsTableComponent,
    imports: [
      DetailsItemComponent,
    ],
  });

  beforeEach(() => {
    spectator = createHost(`
      <ix-details-table>
        <ix-details-item [label]="'Name' | translate">
          {{ user.name}}
        </ix-details-item>
      </ix-details-table>
    `, {
      hostProps: {
        user: {
          name: 'Bob',
        },
      },
    });
  });

  it('renders table with keys and values', () => {
    const element = spectator.fixture.nativeElement as HTMLElement;
    expect(element).toHaveDescendantWithText({
      selector: 'td.key-column',
      text: 'Name',
    });

    expect(element).toHaveDescendantWithText({
      selector: 'td.value-column',
      text: 'Bob',
    });
  });
});
