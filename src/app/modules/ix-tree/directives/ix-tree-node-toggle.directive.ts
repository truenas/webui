import { CdkTreeNodeToggle } from '@angular/cdk/tree';
import { Directive } from '@angular/core';

@Directive({
  selector: '[ixTreeNodeToggle]',
  providers: [{ provide: CdkTreeNodeToggle, useExisting: IxTreeNodeToggleDirective }],
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['recursive: ixTreeNodeToggleRecursive'],
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    class: 'ix-tree-node-toggle',
  },
})
export class IxTreeNodeToggleDirective<T, K = T> extends CdkTreeNodeToggle<T, K> {
}
