import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { SecondaryMenuComponent } from 'app/modules/layout/secondary-menu/secondary-menu.component';

describe('SecondaryMenuComponent', () => {
  let spectator: Spectator<SecondaryMenuComponent>;
  const createComponent = createComponentFactory({
    component: SecondaryMenuComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        menuName: 'credentials',
      },
    });
  });

  it('renders a list of submenu items', () => {
    spectator.setInput({
      subMenuItems: [
        {
          name: 'Users',
          state: 'users',
        },
        {
          name: 'Groups',
          state: 'groups',
        },
      ],
    });

    const items = spectator.queryAll('.sidebar-list-item a');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveText('Users');
    expect(items[1]).toHaveText('Groups');
    expect(items[0]).toHaveAttribute('href', '/credentials/users');
    expect(items[1]).toHaveAttribute('href', '/credentials/groups');
  });

  it('does not render items that have isVisible$ resolve to false', () => {
    spectator.setInput({
      subMenuItems: [
        {
          name: 'Users',
          state: 'users',
        },
        {
          name: 'Groups',
          state: 'groups',
          isVisible$: of(false),
        },
      ],
    });

    const items = spectator.queryAll('.sidebar-list-item a');
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveText('Users');
  });
});
