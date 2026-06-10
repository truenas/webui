import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { TnMenuHarness, TnMenuTesting, tnIconMarker } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { ShareActionsCellComponent } from 'app/pages/sharing/components/shares-dashboard/cells/share-actions-cell/share-actions-cell.component';

interface Row { id: number }

describe('ShareActionsCellComponent', () => {
  let spectator: Spectator<ShareActionsCellComponent<Row>>;

  const onEdit = jest.fn();
  const onDelete = jest.fn();

  const createComponent = createComponentFactory({
    component: ShareActionsCellComponent<Row>,
    providers: [mockAuth()],
  });

  function setup(actions: IconActionConfig<Row>[]): void {
    spectator = createComponent({
      props: {
        actions,
        row: { id: 3 },
        uniqueRowTag: 'card-smb-share-smb123',
        ariaLabel: 'smb123 SMB Share',
      } as unknown as Partial<ShareActionsCellComponent<Row>>,
    });
  }

  const editAction: IconActionConfig<Row> = {
    iconName: tnIconMarker('pencil', 'mdi'),
    tooltip: 'Edit',
    onClick: onEdit,
  };
  const deleteAction: IconActionConfig<Row> = {
    iconName: tnIconMarker('delete', 'mdi'),
    tooltip: 'Delete',
    onClick: onDelete,
  };

  afterEach(() => jest.clearAllMocks());

  it('collapses multiple actions behind a menu and invokes the action handler', async () => {
    setup([editAction, deleteAction]);

    spectator.click('[data-test="button-card-smb-share-smb123-more-action"]');
    const menu = await TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);

    expect(await menu.getItemLabels()).toEqual(['Edit', 'Delete']);

    // Menu items keep the legacy `button-…-row-action` test id (the library
    // composes the `button-` prefix from tn-menu-item's element type).
    const itemTestIds = Array.from(document.querySelectorAll('.tn-menu-item'))
      .map((el) => el.getAttribute('data-test'));
    expect(itemTestIds).toEqual([
      'button-card-smb-share-smb123-more-action-mdi-pencil-row-action',
      'button-card-smb-share-smb123-more-action-mdi-delete-row-action',
    ]);

    await menu.clickItem({ label: 'Delete' });
    expect(onDelete).toHaveBeenCalledWith({ id: 3 });
  });

  it('renders a single action inline (no menu) and invokes it on click', () => {
    setup([editAction]);
    spectator.detectChanges();

    spectator.click('[data-test="button-card-smb-share-smb123-mdi-pencil-row-action"]');
    expect(onEdit).toHaveBeenCalledWith({ id: 3 });
    expect(spectator.query('[data-test="button-card-smb-share-smb123-more-action"]')).toBeNull();
  });

  it('filters out hidden actions', () => {
    setup([editAction, { ...deleteAction, hidden: () => of(true) }]);
    spectator.detectChanges();

    // Only the Edit action remains visible, so it renders as a single inline button.
    expect(spectator.query('[data-test="button-card-smb-share-smb123-mdi-pencil-row-action"]')).not.toBeNull();
    expect(spectator.query('[data-test="button-card-smb-share-smb123-more-action"]')).toBeNull();
  });
});
