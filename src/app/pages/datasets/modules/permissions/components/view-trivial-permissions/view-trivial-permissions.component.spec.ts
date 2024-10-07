import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import {
  PermissionsItemComponent,
} from 'app/pages/datasets/modules/permissions/components/permissions-item/permissions-item.component';
import {
  ViewTrivialPermissionsComponent,
} from 'app/pages/datasets/modules/permissions/components/view-trivial-permissions/view-trivial-permissions.component';

describe('ViewTrivialPermissionsComponent', () => {
  let spectator: Spectator<ViewTrivialPermissionsComponent>;
  const createComponent = createComponentFactory({
    component: ViewTrivialPermissionsComponent,
    imports: [
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

  it('converts FileSystemStat to permission items and shows them as the list', () => {
    const items = spectator.queryAll('ix-permissions-item');

    expect(items[0]).toHaveText('john');
    expect(items[0]).toHaveText('Read | Write | Execute');

    expect(items[1]).toHaveText('johns');
    expect(items[1]).toHaveText('Read | Execute');

    expect(items[2]).toHaveText('Other');
    expect(items[2]).toHaveText('Read | Execute');
  });
});
