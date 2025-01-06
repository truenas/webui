import { createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import {
  PermissionsItemComponent,
} from 'app/pages/datasets/modules/permissions/components/permissions-item/permissions-item.component';
import {
  PermissionItem,
  PermissionsItemType,
} from 'app/pages/datasets/modules/permissions/interfaces/permission-item.interface';

describe('PermissionsItemComponent', () => {
  const createComponent = createComponentFactory({
    component: PermissionsItemComponent,
    declarations: [
      MockComponent(IxIconComponent),
    ],
  });

  it('shows icon, name and permission string for permission item.', () => {
    const spectator = createComponent({
      props: {
        item: {
          name: 'Group – johns',
          description: 'Read | Execute',
          type: PermissionsItemType.Group,
        } as PermissionItem,
      },
    });

    expect(spectator.query(IxIconComponent)!.name).toBe('people');
    expect(spectator.query('.name')).toHaveExactText('Group – johns');
    expect(spectator.query('.permissions')).toHaveExactText('Read | Execute');
  });
});
