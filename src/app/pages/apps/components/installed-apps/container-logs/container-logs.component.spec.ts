import { fakeAsync } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Spectator, SpectatorFactory, createComponentFactory, mockProvider,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ToolbarSliderComponent } from 'app/modules/forms/toolbar-slider/toolbar-slider.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { ContainerLogsComponent } from 'app/pages/apps/components/installed-apps/container-logs/container-logs.component';
import { LogsDetailsDialog } from 'app/pages/apps/components/logs-details-dialog/logs-details-dialog.component';

describe('ContainerLogsComponent', () => {
  let spectator: Spectator<ContainerLogsComponent>;

  describe('When dialog is set a value', () => {
    const createComponent = createComponentFactoryWithDialogResponse(false);

    beforeEach(() => {
      spectator = createComponent();
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
