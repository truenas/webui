import { ScrollingModule } from '@angular/cdk/scrolling';
import { CdkTreeModule } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTreeModule } from '@angular/material/tree';
import { IxTreeVirtualScrollNodeOutletDirective } from 'app/modules/ix-tree/directives/ix-tree-virtual-scroll-node-outlet.directive';
import { IxNestedTreeNodeComponent } from './components/ix-nested-tree-node/ix-nested-tree-node.component';
import { IxTreeNodeComponent } from './components/ix-tree-node/ix-tree-node.component';
import { IxTreeVirtualScrollViewComponent } from './components/ix-tree-virtual-scroll-view/ix-tree-virtual-scroll-view.component';
import { IxTreeComponent } from './components/ix-tree/ix-tree.component';
import { IxTreeNodeDefDirective } from './directives/ix-tree-node-def.directive';
import { IxTreeNodeOutletDirective } from './directives/ix-tree-node-outlet.directive';
import { IxTreeNodePaddingDirective } from './directives/ix-tree-node-padding-def.directive';
import { IxTreeNodeToggleDirective } from './directives/ix-tree-node-toggle.directive';

@NgModule({
  imports: [
    CommonModule,
    CdkTreeModule,
    MatTreeModule,
    MatButtonModule,
    ScrollingModule,
  ],
  declarations: [
    IxTreeNodeComponent,
    IxNestedTreeNodeComponent,
    IxTreeComponent,
    IxTreeNodeDefDirective,
    IxTreeNodeOutletDirective,
    IxTreeNodeToggleDirective,
    IxTreeVirtualScrollViewComponent,
    IxTreeVirtualScrollNodeOutletDirective,
    IxTreeNodePaddingDirective,
  ],
  exports: [
    IxTreeComponent,
    IxTreeNodeComponent,
    IxNestedTreeNodeComponent,
    IxTreeNodeDefDirective,
    IxTreeNodeOutletDirective,
    IxTreeNodeToggleDirective,
    IxTreeVirtualScrollViewComponent,
    IxTreeVirtualScrollNodeOutletDirective,
    IxTreeNodePaddingDirective,
  ],
})
export class IxTreeModule { }
