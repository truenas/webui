import { CdkTreeNodeDef } from '@angular/cdk/tree';
import { Directive, Input } from '@angular/core';
import { IxNestedTreeDataSource } from 'app/modules/ix-tree/ix-nested-tree-datasource';

@Directive({
  selector: '[ixTreeNodeDef]',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['when: ixTreeNodeDefWhen'],
  providers: [{ provide: CdkTreeNodeDef, useExisting: IxTreeNodeDefDirective }],
})
export class IxTreeNodeDefDirective<T> extends CdkTreeNodeDef<T> {
  // Leveraging syntactic-sugar syntax when we use *ixTreeNodeDef
  @Input() ixTreeNodeDefDataSource: IxNestedTreeDataSource<T>;

  // ngTemplateContextGuard flag to help with the Language Service
  static ngTemplateContextGuard<T>(
    dir: IxTreeNodeDefDirective<T>,
    ctx: unknown,
  ): ctx is { $implicit: T; index: number } {
    return true;
  }
}
