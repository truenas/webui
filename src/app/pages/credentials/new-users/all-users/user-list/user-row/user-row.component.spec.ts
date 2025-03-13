import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { Role } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { UserRowComponent } from 'app/pages/credentials/new-users/all-users/user-list/user-row/user-row.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';

const user = {
  id: 1,
  username: 'testuser',
  full_name: 'Test User',
  locked: false,
  roles: [Role.FullAdmin],
} as User;

describe('UserRowComponent', () => {
  let spectator: Spectator<UserRowComponent>;

  const createComponent = createComponentFactory({
    component: UserRowComponent,
    imports: [MapValuePipe],
    providers: [
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockProvider(ApiService),
      mockProvider(ErrorHandlerService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { user },
    });
  });

  describe('cell rendering', () => {
    it('shows username', () => {
      expect(spectator.query('.cell-name')).toHaveText('testuser');
    });

    it('shows full name', () => {
      const cells = spectator.queryAll('.cell');
      expect(cells[2]).toHaveText('Test User');
    });

    it('shows last login value', () => {
      const cells = spectator.queryAll('.cell');
      expect(cells[3]).toHaveText('N/A');
    });

    it('shows role if available', () => {
      const cells = spectator.queryAll('.cell');
      expect(cells[4]).toHaveText('Full Admin');
    });

    it('shows "-" if role is not available', () => {
      spectator.setInput('user', { ...user, roles: [] });
      const cells = spectator.queryAll('.cell');
      expect(cells[4]).toHaveText('-');
    });
  });
});
