import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import {
  TnIconButtonHarness, TnMenuHarness, TnMenuTesting, tnIconMarker,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IconActionConfig } from 'app/modules/tn-table/interfaces/icon-action-config.interface';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';

interface Row { id: number }

describe('TableActionsCellComponent', () => {
  let spectator: Spectator<TableActionsCellComponent<Row>>;
  let loader: HarnessLoader;

  const onEdit = jest.fn();
  const onDelete = jest.fn();

  const createComponent = createComponentFactory({
    component: TableActionsCellComponent<Row>,
    providers: [mockAuth()],
  });

  function setup(actions: IconActionConfig<Row>[]): void {
    spectator = createComponent({
      props: {
        actions,
        row: { id: 3 },
        uniqueRowTag: 'card-smb-share-smb123',
        ariaLabel: 'smb123 SMB Share',
      } as unknown as Partial<TableActionsCellComponent<Row>>,
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  function getMenuTrigger(): Promise<TnIconButtonHarness | null> {
    return loader.getHarnessOrNull(TnIconButtonHarness.with({ name: 'dots-vertical' }));
  }

  // Inline actions render `action.iconName` verbatim, i.e. the `tnIconMarker` value
  // the action config was built with ('mdi-pencil', not 'pencil').
  function getInlineAction(action: IconActionConfig<Row>): Promise<TnIconButtonHarness | null> {
    return loader.getHarnessOrNull(TnIconButtonHarness.with({ name: action.iconName }));
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

    await (await getMenuTrigger())!.click();
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

  it('renders a single action inline (no menu) and invokes it on click', async () => {
    setup([editAction]);
    spectator.detectChanges();

    await (await getInlineAction(editAction))!.click();
    expect(onEdit).toHaveBeenCalledWith({ id: 3 });
    expect(await getMenuTrigger()).toBeNull();
  });

  it('filters out hidden actions', async () => {
    setup([editAction, { ...deleteAction, hidden: () => of(true) }]);
    spectator.detectChanges();

    // Only the Edit action remains visible, so it renders as a single inline button.
    expect(await getInlineAction(editAction)).not.toBeNull();
    expect(await getInlineAction(deleteAction)).toBeNull();
    expect(await getMenuTrigger()).toBeNull();
  });

  // A `[clickable]` tn-table listens for click and keydown on the <tr>. Both must stop at
  // the cell, or activating a row action also toggles the row — and tn-table's keydown
  // handler calls preventDefault(), which would cancel the action entirely. The click half
  // is covered end-to-end in all-cloud-backups.component.spec.ts, where a real clickable
  // row exists; jsdom does not propagate a synthetic click to it in this bare fixture.
  it('stops a keydown from propagating out of the cell to the surrounding row', () => {
    setup([editAction]);
    spectator.detectChanges();

    const onRowKeydown = jest.fn();
    spectator.element.addEventListener('keydown', onRowKeydown);

    // The single visible action renders as one inline `tn-icon-button`; the event has to
    // be a real bubbling KeyboardEvent, since the handler under test works by stopping
    // propagation on the way up.
    const actionButton = spectator.query('tn-icon-button button')!;
    spectator.dispatchKeyboardEvent(actionButton, 'keydown', 'Enter');

    expect(onRowKeydown).not.toHaveBeenCalled();

    // Control: only the row-activation keys are swallowed, so a key the table does not
    // treat as "activate" still reaches the row — proving the dispatch above did fire.
    spectator.dispatchKeyboardEvent(actionButton, 'keydown', 'Escape');

    expect(onRowKeydown).toHaveBeenCalled();
  });

  it('keeps an action visible when its async hidden() resolves to false', async () => {
    setup([editAction, { ...deleteAction, hidden: () => of(false) }]);
    spectator.detectChanges();

    // Both actions stay visible, so they collapse behind the menu trigger.
    await (await getMenuTrigger())!.click();
    const menu = await TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
    expect(await menu.getItemLabels()).toEqual(['Edit', 'Delete']);
  });
});
