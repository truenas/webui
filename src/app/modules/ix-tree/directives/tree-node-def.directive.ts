import { DataSource } from '@angular/cdk/collections';
import { CdkTreeNodeDef } from '@angular/cdk/tree';
import { Directive, Input } from '@angular/core';

@Directive({
  selector: '[ixTreeNodeDef]',
  providers: [{ provide: CdkTreeNodeDef, useExisting: IxTreeNodeDefDirective }],
})
export class IxTreeNodeDefDirective<T> extends CdkTreeNodeDef<T> {
  // Leveraging syntactic-sugar syntax when we use *ixTreeNodeDef
  @Input() ixTreeNodeDefDataSource: DataSource<T>;
  @Input('ixTreeNodeDefWhen') override when!: (index: number, nodeData: T) => boolean;

  // ngTemplateContextGuard flag to help with the Language Service
  static ngTemplateContextGuard<T>(
    dir: IxTreeNodeDefDirective<T>,
    ctx: unknown,
  ): ctx is { $implicit: T; index: number } {
    return true;
  }
}
