import { ComponentHarnessConstructor, HarnessPredicate } from '@angular/cdk/testing';
import { MatTreeNodeHarness, TreeNodeHarnessFilters } from '@angular/material/tree/testing';

function getNodePredicate<T extends TreeNodeHarness>(
  type: ComponentHarnessConstructor<T>,
  options: TreeNodeHarnessFilters,
): HarnessPredicate<T> {
  return new HarnessPredicate(type, options)
    .addOption('text', options.text, (harness, text) => HarnessPredicate.stringMatches(harness.getText(), text))
    .addOption(
      'disabled',
      options.disabled,
      async (harness, disabled) => (await harness.isDisabled()) === disabled,
    )
    .addOption(
      'expanded',
      options.expanded,
      async (harness, expanded) => (await harness.isExpanded()) === expanded,
    )
    .addOption(
      'level',
      options.level,
      async (harness, level) => (await harness.getLevel()) === level,
    );
}

export class TreeNodeHarness extends MatTreeNodeHarness {
  static override readonly hostSelector = '.ix-tree-node, .ix-nested-tree-node';
  override _toggle = this.locatorForOptional('[treeNodeToggle]');

  /**
   * Gets a `HarnessPredicate` that can be used to search for a tree node with specific attributes.
   * @param options Options for narrowing the search
   * @return a `HarnessPredicate` configured with the given options.
   */
  static override with(options: TreeNodeHarnessFilters = {}): HarnessPredicate<TreeNodeHarness> {
    return getNodePredicate(TreeNodeHarness, options);
  }

  override async getText(): Promise<string> {
    return (await this.host()).text({ exclude: '.ix-tree-node, .ix-nested-tree-node, button' });
  }
}
