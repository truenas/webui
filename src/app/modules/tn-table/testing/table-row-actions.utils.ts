import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture } from '@angular/core/testing';
import { TnIconButtonHarness, TnMenuHarness, TnMenuTesting } from '@truenas/ui-components';

/**
 * Opens a `tn-table` row's "⋮" actions menu and returns it, read from the root loader because
 * `tn-menu` renders in an overlay. `triggerIndex` counts menu triggers, not rows: a row with a single
 * action renders it inline, without a menu.
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
