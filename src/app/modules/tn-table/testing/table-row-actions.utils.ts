import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture } from '@angular/core/testing';
import { TnIconButtonHarness, TnMenuHarness, TnMenuTesting } from '@truenas/ui-components';

/**
 * Opens the "⋮" actions menu of a `tn-table` row and returns the open menu.
 *
 * `TableActionsCellComponent` collapses a row's actions behind a `dots-vertical`
 * icon button once there is more than one of them, and `tn-menu` renders into an
 * overlay rather than inside the fixture — so the menu has to be read from the
 * root loader, not the fixture loader.
 *
 * Scoped to `tn-table` because a page's own header often has a `dots-vertical`
 * menu of its own. `triggerIndex` counts menu triggers, not table rows — a row
 * left with a single visible action renders that action inline instead of behind
 * a menu, so the two only line up when every row has more than one action.
 */
export async function openRowActionsMenu(
  fixture: ComponentFixture<unknown>,
  triggerIndex = 0,
): Promise<TnMenuHarness> {
  const triggers = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(
    TnIconButtonHarness.with({ name: 'dots-vertical', ancestor: 'tn-table' }),
  );

  if (!triggers[triggerIndex]) {
    throw new Error(`No row actions menu at index ${triggerIndex}; the table rendered ${triggers.length}.`);
  }

  await triggers[triggerIndex].click();

  return TnMenuTesting.rootLoader(fixture).getHarness(TnMenuHarness);
}
