import { Location } from '@angular/common';
import { fakeAsync } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import {
  Spectator, SpectatorFactory, createComponentFactory, mockProvider,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ToolbarSliderComponent } from 'app/modules/forms/toolbar-slider/toolbar-slider.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ContainerLogsComponent } from 'app/pages/apps/components/installed-apps/container-logs/container-logs.component';
import { LogsDetailsDialogComponent } from 'app/pages/apps/components/logs-details-dialog/logs-details-dialog.component';
import { WebSocketService } from 'app/services/ws.service';

describe('ContainerLogsComponent', () => {
  let spectator: Spectator<ContainerLogsComponent>;

  describe('When dialog is set a value', () => {
    const createComponent = createComponentFactoryWithDialogResponse(false);

    beforeEach(() => {
      spectator = createComponent();
    });

    it('subscribes to logs updates', () => {
      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(LogsDetailsDialogComponent, { width: '400px' });

      expect(spectator.inject(WebSocketService).subscribeToLogs).toHaveBeenCalledWith(
        'app.container_log_follow: {"app_name":"ix-test-app","container_id":"ix-test-container","tail_lines":650}',
      );
    });

    it('shows meta data', () => {
      expect(spectator.queryAll('.meta-data .name').map((name) => name.textContent.trim())).toEqual([
        'ix-test-app',
        'ix-test-container',
      ]);
    });

    it('shows logs', () => {
      expect(spectator.queryAll('.log-row').map((name) => name.textContent.trim())).toEqual([
        '[12:34]Some logs.',
      ]);
    });
  });

  describe('When cancel is clicked', () => {
    const createComponent = createComponentFactoryWithDialogResponse(true);

    beforeEach(() => {
      spectator = createComponent();
    });

    it('cancelling the dialog should call back method', fakeAsync(() => {
      expect(spectator.inject(Location).back).toHaveBeenCalled();
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
        mockProvider(Location),
        mockProvider(MatDialog, {
          open: jest.fn(() => ({
            afterClosed: jest.fn(() => {
              if (cancel) {
                return of(false);
              }

              return of({
                tail_lines: 650,
              } as LogsDetailsDialogComponent['form']['value']);
            }),
          }) as unknown as MatDialogRef<LogsDetailsDialogComponent>),
        }),
        mockProvider(WebSocketService, {
          subscribeToLogs: jest.fn(() => of({
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
