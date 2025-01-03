import { Location } from '@angular/common';
import { fakeAsync, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { ConfigResetComponent } from 'app/pages/system-tasks/config-reset/config-reset.component';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

describe('ConfigResetComponent', () => {
  let spectator: Spectator<ConfigResetComponent>;
  const isConnected$ = new BehaviorSubject(false);
  const createComponent = createComponentFactory({
    component: ConfigResetComponent,
    shallow: true,
    declarations: [
      MockComponent(IxIconComponent),
      MockComponent(CopyrightLineComponent),
    ],
    providers: [
      mockApi([
        mockJob('config.reset', fakeSuccessfulJob()),
      ]),
      mockProvider(MatDialog),
      mockProvider(Location),
      mockProvider(WebSocketHandlerService, {
        prepareShutdown: jest.fn(),
      }),
      mockProvider(WebSocketStatusService, {
        isConnected$,
      }),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of({}),
        })),
      }),
      mockProvider(Router),
    ],
  });

  beforeEach(fakeAsync(() => {
    spectator = createComponent();
    tick(15000);
    isConnected$.next(true);
    tick(1500);
  }));

  it('closes on dialogs when user navigates to this page', () => {
    expect(spectator.inject(MatDialog).closeAll).toHaveBeenCalled();
  });

  it('replaces location state to avoid resetting config again if user visits the page again', () => {
    expect(spectator.inject(Location).replaceState).toHaveBeenCalledWith('/signin');
  });

  it('resets config when user visits the page and waits for websocket to reconnect', fakeAsync(() => {
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('config.reset', [{ reboot: true }]);
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(WebSocketHandlerService).prepareShutdown).toHaveBeenCalled();
  }));

  it('takes user to sign-in page when new websocket connection is established after config reset', fakeAsync(() => {
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/signin']);
  }));
});
