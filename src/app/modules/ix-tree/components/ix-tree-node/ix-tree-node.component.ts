import { DataSource } from '@angular/cdk/collections';
import { CdkTreeNode } from '@angular/cdk/tree';
import {
  Attribute, Component, ElementRef, Input, OnDestroy, OnInit,
} from '@angular/core';
import {
  mixinTabIndex, mixinDisabled, CanDisable, HasTabIndex,
} from '@angular/material/core';
import { IxTreeComponent } from 'app/modules/ix-tree/components/ix-tree/ix-tree.component';

const ixTreeNodeBase = mixinTabIndex(mixinDisabled(CdkTreeNode));

@Component({
  selector: 'ix-tree-node',
  templateUrl: './ix-tree-node.component.html',
  styleUrls: ['./ix-tree-node.component.scss'],
  exportAs: 'ixTreeNode',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['role', 'disabled', 'tabIndex'],
  providers: [{ provide: CdkTreeNode, useExisting: IxTreeNodeComponent }],
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    class: 'ix-tree-node',
  },
})
export class IxTreeNodeComponent<T, K = T> extends ixTreeNodeBase<T, K>
  implements CanDisable, HasTabIndex, OnInit, OnDestroy {
  @Input() ixTreeNodeDefDataSource: DataSource<T>;

  constructor(
    elementRef: ElementRef<HTMLElement>,
    tree: IxTreeComponent<T>,
    @Attribute('tabindex') tabIndex: string,
  ) {
    super(elementRef, tree);
    this.tabIndex = Number(tabIndex) || 0;
  }

  // This is a workaround for https://github.com/angular/angular/issues/23091
  // In aot mode, the lifecycle hooks from parent class are not called.
  override ngOnInit(): void {
    super.ngOnInit();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
