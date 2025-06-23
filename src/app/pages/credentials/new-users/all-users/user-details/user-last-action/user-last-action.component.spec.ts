import { fakeAsync, flush, tick } from '@angular/core/testing';
import { byText } from '@ngneat/spectator';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { AuditEvent } from 'app/enums/audit.enum';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { IxDateComponent } from 'app/modules/dates/pipes/ix-date/ix-date.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { UserLastActionComponent } from 'app/pages/credentials/new-users/all-users/user-details/user-last-action/user-last-action.component';

describe('UserLastActionComponent', () => {
  let spectator: Spectator<UserLastActionComponent>;

  const createComponent = createComponentFactory({
    component: UserLastActionComponent,
    imports: [
      MockComponent(IxDateComponent),
    ],
    providers: [
      mockApi([
        mockCall('audit.query', [{
          event: AuditEvent.Login,
          message_timestamp: 1749822469,
        } as AuditEntry]),
      ]),
    ],
  });

  it('loads last action lazily and displays it', fakeAsync(() => {
    spectator = createComponent({ props: { username: 'john' } });

    expect(spectator.query('ngx-skeleton-loader')).toBeTruthy();

    tick(500);
    spectator.detectChanges();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('audit.query', [{
      'query-filters': [['username', '=', 'john']],
      'query-options': { limit: 1, order_by: ['-message_timestamp'] },
    }]);
    expect(spectator.query('ngx-skeleton-loader')).toBeNull();
    expect(spectator.query('.label')).toHaveText('Last Action:');
    expect(spectator.query('.value')).toHaveText('Login');
    expect(spectator.query(IxDateComponent, { parentSelector: '.value' }).date).toBe(1749822469 * 1000);
  }));

  it('has a Search Logs link that takes user to the audit page', fakeAsync(() => {
    spectator = createComponent({ props: { username: 'john' } });

    flush();

    const link = spectator.query(byText('See Logs'));

    expect(link).toHaveAttribute(
      'href',
      '/system/audit/%7B%22searchQuery%22:%7B%22isBasicQuery%22:false,%22filters%22:%5B%5B%22username%22,%22%3D%22,%22john%22%5D%5D%7D%7D',
    );
  }));
});
