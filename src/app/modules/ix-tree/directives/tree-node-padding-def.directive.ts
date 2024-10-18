import { CdkTreeNodePadding } from '@angular/cdk/tree';
import { Directive, Input } from '@angular/core';

@Directive({
  selector: '[treeNodePadding]',
  standalone: true,
  providers: [{ provide: CdkTreeNodePadding, useExisting: TreeNodePaddingDirective }],
})
export class TreeNodePaddingDirective<T> extends CdkTreeNodePadding<T> {
  override _indent = 24;

  @Input('treeNodePadding')
  override get level(): number {
    return this._level;
  }

  override set level(value: number) {
    this._setLevelInput(value);
  }

  @Input('treeNodePaddingIndent')
  override get indent(): number | string {
    return this._indent;
  }

  override set indent(indent: number | string) {
    this._setIndentInput(indent);
  }
}
