import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent, MockModule } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ToolbarSliderComponent } from 'app/modules/forms/toolbar-slider/toolbar-slider.component';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { ContainerLogsComponent } from 'app/pages/apps/components/installed-apps/container-logs/container-logs.component';
import { LogsDetailsDialogComponent } from 'app/pages/apps/components/logs-details-dialog/logs-details-dialog.component';
import { WebSocketService } from 'app/services/ws.service';

describe('ContainerLogsComponent', () => {
  let spectator: Spectator<ContainerLogsComponent>;

  const createComponent = createComponentFactory({
    component: ContainerLogsComponent,
    imports: [
      MockModule(PageHeaderModule),
    ],
    declarations: [
      MockComponent(ToolbarSliderComponent),
    ],
    providers: [
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of({
            tail_lines: 650,
          } as LogsDetailsDialogComponent['form']['value']),
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
