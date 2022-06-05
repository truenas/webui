import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { PermissionsItemComponent } from 'app/pages/storage/volumes/permissions/components/permissions-item/permissions-item.component';
import { TrivialPermissionsComponent } from 'app/pages/storage/volumes/permissions/components/view-trivial-permissions/trivial-permissions.component';

describe('TrivialPermissionsComponent', () => {
  let spectator: Spectator<TrivialPermissionsComponent>;
  const createComponent = createComponentFactory({
    component: TrivialPermissionsComponent,
    declarations: [
      PermissionsItemComponent,
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        stat: {
          user: 'john',
          group: 'johns',
          mode: 16877,
        } as FileSystemStat,
      },
    });
  });

  it('it converts FileSystemStat to permission items and shows them as the list', () => {
    const items = spectator.queryAll('ix-permissions-item');

    expect(items[0]).toHaveText('john');
    expect(items[0]).toHaveText('Read | Write | Execute');

    expect(items[1]).toHaveText('johns');
    expect(items[1]).toHaveText('Read | Execute');

    expect(items[2]).toHaveText('Other');
    expect(items[2]).toHaveText('Read | Execute');
  });
});
