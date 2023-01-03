import { NumberInput } from '@angular/cdk/coercion';
import { CdkTreeNodePadding } from '@angular/cdk/tree';
import { Directive, Input } from '@angular/core';

@Directive({
  selector: '[ixTreeNodePadding]',
  providers: [{ provide: CdkTreeNodePadding, useExisting: IxTreeNodePaddingDirective }],
})
export class IxTreeNodePaddingDirective<T> extends CdkTreeNodePadding<T> {
  override _indent = 24;

  @Input('ixTreeNodePadding')
  override get level(): number {
    return this._level;
  }
  override set level(value: NumberInput) {
    this._setLevelInput(value);
  }

  @Input('ixTreeNodePaddingIndent')
  override get indent(): number | string {
    return this._indent;
  }
  override set indent(indent: number | string) {
    this._setIndentInput(indent);
  }
}
