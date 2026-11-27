/**
 * Stories: the search above the Datasets tree narrows it to the datasets whose name holds the text, with
 * their parents, and choosing a match opens its details; a term that matches nothing shows the empty
 * state; and clearing the search brings the whole tree back.
 *
 * The search opens the parents of every match, and clearing it puts back the rows that were open before.
 */
import type { Locator, Page } from '@playwright/test';
import { ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { expandDatasetNode } from '../flows/dataset-tree';
import { goToDatasets } from '../flows/navigation';
import { datasetDetailsLocators, datasetLocators } from '../locators/storage';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const rootLeaf = 'e2e_search_root';
const middleLeaf = 'e2e_search_mid';
const matchLeaf = 'e2e_search_needle';
const siblingLeaf = 'e2e_search_other';
/** Part of the match's name and of no other dataset's. */
const term = 'needle';
const noMatchTerm = 'e2e_no_such_dataset';

interface Branch {
  root: string;
  middle: string;
  match: string;
  /** Beside `middle`, so it shares the match's parent and grandparent but not its name. */
  sibling: string;
}

function branchIn(pool: string): Branch {
  const root = `${pool}/${rootLeaf}`;
  const middle = `${root}/${middleLeaf}`;
  return {
    root,
    middle,
    match: `${middle}/${matchLeaf}`,
    sibling: `${root}/${siblingLeaf}`,
  };
}

function treeNode(page: Page, name: string): Locator {
  return page.locator(datasetLocators.treeNode(name));
}

/** Opens the tree down to the match's parent, which leaves that parent selected. */
async function openBranch(page: Page, pool: string, branch: Branch): Promise<void> {
  await goToDatasets(page);
  await expandDatasetNode(page, pool);
  await expandDatasetNode(page, branch.root);
  await expandDatasetNode(page, branch.middle);
}

test.beforeEach(async ({ api, pool }) => {
  const branch = branchIn(pool);
  await ensureDatasetAbsent(api, branch.root);
  await ensureDatasetPresent(api, branch.root);
  await ensureDatasetPresent(api, branch.middle);
  await ensureDatasetPresent(api, branch.match);
  await ensureDatasetPresent(api, branch.sibling);
});

test.afterEach(async ({ api, pool }) => {
  const { root } = branchIn(pool);
  if (leavingTestData(`the dataset "${root}" and its children`)) {
    return;
  }

  await runCleanupSteps([
    [`remove the dataset "${root}" and its children`, () => ensureDatasetAbsent(api, root)],
  ]);
});

test('searching narrows the tree to the match and its parents, and choosing it opens its details', async ({
  page, pool,
}) => {
  const branch = branchIn(pool);
  const node = (name: string): Locator => treeNode(page, name);

  // Nothing is opened first: the search opens the match's parents itself.
  await goToDatasets(page);
  await expect(node(branch.match)).toBeHidden();

  await page.locator(datasetLocators.search).fill(term);

  await expect(node(branch.sibling)).toBeHidden();
  await expect(node(branch.match)).toBeVisible();
  await expect(node(branch.middle)).toBeVisible();
  await expect(node(branch.root)).toBeVisible();
  await expect(node(pool)).toBeVisible();
  // The pool the page selected on entry is not a match, so its details are not shown while the search holds.
  await expect(page.locator(datasetDetailsLocators.path)).toBeHidden();

  await node(branch.match).click();
  await expect(page.locator(datasetDetailsLocators.path)).toHaveText(branch.match);
});

test('a term that matches nothing shows the empty state, and clearing it brings the tree back', async ({
  page, pool,
}) => {
  const branch = branchIn(pool);
  const node = (name: string): Locator => treeNode(page, name);
  const search = page.locator(datasetLocators.search);

  await openBranch(page, pool, branch);

  await search.fill(noMatchTerm);
  await expect(page.locator(datasetLocators.noSearchResults)).toBeVisible();
  await expect(node(pool)).toBeHidden();
  await expect(node(branch.match)).toBeHidden();

  await page.locator(datasetLocators.clearSearch).click();
  await expect(search).toHaveValue('');
  await expect(page.locator(datasetLocators.noSearchResults)).toBeHidden();
  for (const name of [pool, branch.root, branch.middle, branch.match, branch.sibling]) {
    await expect(node(name)).toBeVisible();
  }
  // The selection outlived the search.
  await expect(page.locator(datasetDetailsLocators.path)).toHaveText(branch.middle);
});
