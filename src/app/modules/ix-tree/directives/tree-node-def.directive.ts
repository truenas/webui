import { DataSource } from '@angular/cdk/collections';
import { CdkTreeNodeDef } from '@angular/cdk/tree';
import { Directive, Input, input } from '@angular/core';
import { TreeDataSource } from 'app/modules/ix-tree/tree-datasource';

@Directive({
  selector: '[treeNodeDef]',
  providers: [{ provide: CdkTreeNodeDef, useExisting: TreeNodeDefDirective }],
  standalone: true,
})
export class TreeNodeDefDirective<T, K = T> extends CdkTreeNodeDef<T> {
  readonly treeNodeDefDataSource = input<DataSource<T> | TreeDataSource<T, K> | undefined>(undefined);
  @Input('treeNodeDefWhen') override when!: (index: number, nodeData: T) => boolean;

  // ngTemplateContextGuard flag to help with the Language Service
  static ngTemplateContextGuard<T>(
    dir: TreeNodeDefDirective<T>,
    ctx: unknown,
  ): ctx is { $implicit: T; index: number } {
    return true;
  }
}
