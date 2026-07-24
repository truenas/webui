import { ComponentFixture } from '@angular/core/testing';

/**
 * Settles a rendered tn-tree: tn-nested-tree-node defers each child level's
 * insertion to a microtask (one tree level per stabilization pass), so a
 * freshly-rendered tree needs several passes before every row exists in the
 * DOM. The default of 4 passes covers the deepest trees under test
 * (e.g. group → vdev → disk).
 */
export async function settleDeferredTree(fixture: ComponentFixture<unknown>, passes = 4): Promise<void> {
  for (let i = 0; i < passes; i++) {
    await fixture.whenStable();
    fixture.detectChanges();
  }
}
