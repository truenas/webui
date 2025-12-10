import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Spectator, SpectatorFactory, createComponentFactory, mockProvider,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { ToolbarSliderComponent } from 'app/modules/forms/toolbar-slider/toolbar-slider.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { ContainerLogsComponent } from 'app/pages/apps/components/installed-apps/container-logs/container-logs.component';
import { LogsDetailsDialog } from 'app/pages/apps/components/logs-details-dialog/logs-details-dialog.component';

describe('ContainerLogsComponent', () => {
  let spectator: Spectator<ContainerLogsComponent>;
  let loader: HarnessLoader;

  describe('When dialog is set a value', () => {
    const createComponent = createComponentFactoryWithDialogResponse(false);

    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('subscribes to logs updates', () => {
      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(LogsDetailsDialog, { width: '400px' });

      expect(spectator.inject(ApiService).subscribe).toHaveBeenCalledWith(
        'app.container_log_follow: {"app_name":"ix-test-app","container_id":"ix-test-container","tail_lines":650}',
      );
    });

    it('shows meta data', () => {
      expect(spectator.queryAll('.meta-data .name').map((name) => name.textContent!.trim())).toEqual([
        'ix-test-app',
        'ix-test-container',
      ]);
    });

    it('shows logs', () => {
      expect(spectator.queryAll('.log-row').map((name) => name.textContent!.trim())).toEqual([
        '[12:34]Some logs.',
      ]);
    });

    it('has auto-scroll checkbox enabled by default', async () => {
      const checkbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Auto Scroll' }));
      expect(await checkbox.getValue()).toBe(true);
    });
  });

  describe('auto-scroll behavior', () => {
    let logSubject$: Subject<{ fields: { timestamp: string; data: string } }>;

    const createComponent = createComponentFactory({
      component: ContainerLogsComponent,
      imports: [
        MockComponent(PageHeaderComponent),
      ],
      declarations: [
        MockComponent(ToolbarSliderComponent),
      ],
      providers: [
        mockProvider(Router),
        mockProvider(MatDialog, {
          open: jest.fn(() => ({
            afterClosed: jest.fn(() => of({ tail_lines: 500 } as LogsDetailsDialog['form']['value'])),
          }) as unknown as MatDialogRef<LogsDetailsDialog>),
        }),
        mockProvider(ApiService, {
          subscribe: jest.fn(() => {
            logSubject$ = new Subject();
            return logSubject$.asObservable();
          }),
        }),
        mockAuth(),
        {
          provide: ActivatedRoute,
          useValue: {
            parent: { params: of({ appId: 'ix-test-app' }) },
            params: of({ containerId: 'ix-test-container' }),
          },
        },
      ],
    });

    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('does not scroll when auto-scroll is disabled and new logs arrive', async () => {
      const checkbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Auto Scroll' }));
      await checkbox.setValue(false);

      const logContainer = spectator.query('.logs') as HTMLElement;
      jest.spyOn(logContainer, 'scrollHeight', 'get').mockReturnValue(1000);
      logContainer.scrollTop = 0;

      logSubject$.next({ fields: { timestamp: '[12:35]', data: 'New log entry' } });
      spectator.detectChanges();

      expect(logContainer.scrollTop).toBe(0);
    });
  });

  describe('When cancel is clicked', () => {
    const createComponent = createComponentFactoryWithDialogResponse(true);

    beforeEach(() => {
      spectator = createComponent();
    });

    it('cancelling the dialog returns user to installed apps with app selected', fakeAsync(() => {
      expect(spectator.inject(Router).navigate).toHaveBeenCalled();
    }));
  });

  function createComponentFactoryWithDialogResponse(cancel = false): SpectatorFactory<ContainerLogsComponent> {
    return createComponentFactory({
      component: ContainerLogsComponent,
      imports: [
        MockComponent(PageHeaderComponent),
      ],
      declarations: [
        MockComponent(ToolbarSliderComponent),
      ],
      providers: [
        mockProvider(Router),
        mockProvider(MatDialog, {
          open: jest.fn(() => ({
            afterClosed: jest.fn(() => {
              if (cancel) {
                return of(false);
              }

              return of({
                tail_lines: 650,
              } as LogsDetailsDialog['form']['value']);
            }),
          }) as unknown as MatDialogRef<LogsDetailsDialog>),
        }),
        mockProvider(ApiService, {
          subscribe: jest.fn(() => of({
            fields: {
              timestamp: '[12:34]',
              data: 'Some logs.',
            },
          })),
        }),
        mockAuth(),
        {
          provide: ActivatedRoute,
          useValue: {
            parent: {
              params: of({ appId: 'ix-test-app' }),
            },
            params: of({ containerId: 'ix-test-container' }),
          },
        },
      ],
    });
  }
});
