import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { ChartReleaseEvent } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { AppHistoryCardComponent } from 'app/pages/apps/components/installed-apps/app-history-card/app-history-card.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';

const mockEvents = [
  {
    metadata: {
      creation_timestamp: {
        $date: 1682568280000,
      },
    },
    message: 'Started container minio',
  },
  {
    metadata: {
      creation_timestamp: {
        $date: 1682568279000,
      },
    },
    message: 'Created container minio',
  },
  {
    metadata: {
      creation_timestamp: {
        $date: 1682491453000,
      },
    },
    message: 'Started container minio',
  },
  {
    metadata: {
      creation_timestamp: {
        $date: 1682491452000,
      },
    },
    message: 'Created container minio',
  },
  {
    metadata: {
      creation_timestamp: {
        $date: 1682491349000,
      },
    },
    message: 'Created pod: minio-78964b485d-p786h',
  },
] as ChartReleaseEvent[];

describe('AppHistoryCardComponent', () => {
  let spectator: Spectator<AppHistoryCardComponent>;
  let loader: HarnessLoader;

  const app = {
    id: 'ix-test-app',
    name: 'ix-test-app',
  } as ChartRelease;

  const createComponent = createComponentFactory({
    component: AppHistoryCardComponent,
    declarations: [
      MockComponent(NgxSkeletonLoaderComponent),
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockProvider(ApplicationsService, {
        getChartReleaseEvents: jest.fn(() => of(mockEvents)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        app,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks header elements', () => {
    expect(spectator.query('h3')).toHaveText('History');
    expect(spectator.query('h4')).toHaveText('Related Kubernetes Events');
    expect(spectator.query('mat-card-header button')).toExist();
  });

  it('checks events are display properly (newest at top)', () => {
    const events = spectator.queryAll('.event-item');
    expect(events).toHaveLength(5);

    expect(events[0]).toHaveText('2023-04-27 07:04:40 Started container minio');
    expect(events[1]).toHaveText('2023-04-27 07:04:39 Created container minio');
    expect(events[2]).toHaveText('2023-04-26 09:44:13 Started container minio');
    expect(events[3]).toHaveText('2023-04-26 09:44:12 Created container minio');
    expect(events[4]).toHaveText('2023-04-26 09:42:29 Created pod: minio-78964b485d-p786h');
  });

  it('checks refreshing events when button is pressed', async () => {
    mockEvents.push(
      {
        metadata: {
          creation_timestamp: {
            $date: 1682568288888,
          },
        },
        message: 'Newest chart release event',
      } as ChartReleaseEvent,
    );

    const refreshButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Refresh Events"]' }));
    await refreshButton.click();

    expect(spectator.queryAll('.event-item')).toHaveLength(6);
    expect(spectator.query('.event-item')).toHaveText('2023-04-27 07:04:48 Newest chart release event');
  });
});
