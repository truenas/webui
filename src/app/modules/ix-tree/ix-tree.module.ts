import { ScrollingModule } from '@angular/cdk/scrolling';
import { CdkTreeModule } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxNestedTreeNodeComponent } from 'app/modules/ix-tree/components/nested-tree-node/nested-tree-node.component';
import { IxTreeNodeComponent } from 'app/modules/ix-tree/components/tree-node/tree-node.component';
import { IxTreeViewComponent } from 'app/modules/ix-tree/components/tree-view/tree-view.component';
import { IxTreeVirtualScrollViewComponent } from 'app/modules/ix-tree/components/tree-virtual-scroll-view/tree-virtual-scroll-view.component';
import { IxTreeNodeDefDirective } from 'app/modules/ix-tree/directives/tree-node-def.directive';
import { IxTreeNodeOutletDirective } from 'app/modules/ix-tree/directives/tree-node-outlet.directive';
import { IxTreeNodePaddingDirective } from 'app/modules/ix-tree/directives/tree-node-padding-def.directive';
import { IxTreeNodeToggleDirective } from 'app/modules/ix-tree/directives/tree-node-toggle.directive';
import { IxTreeVirtualScrollNodeOutletDirective } from 'app/modules/ix-tree/directives/tree-virtual-scroll-node-outlet.directive';

@NgModule({
  imports: [
    CdkTreeModule,
    CommonModule,
    IxIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatTreeModule,
    ScrollingModule,
    TranslateModule,
  ],
  declarations: [
    IxNestedTreeNodeComponent,
    IxTreeNodeComponent,
    IxTreeNodeDefDirective,
    IxTreeNodeOutletDirective,
    IxTreeNodePaddingDirective,
    IxTreeNodeToggleDirective,
    IxTreeViewComponent,
    IxTreeVirtualScrollNodeOutletDirective,
    IxTreeVirtualScrollViewComponent,
  ],
  exports: [
    IxNestedTreeNodeComponent,
    IxTreeNodeComponent,
    IxTreeNodeDefDirective,
    IxTreeNodeOutletDirective,
    IxTreeNodePaddingDirective,
    IxTreeNodeToggleDirective,
    IxTreeViewComponent,
    IxTreeVirtualScrollNodeOutletDirective,
    IxTreeVirtualScrollViewComponent,
  ],
})
export class IxTreeModule { }
