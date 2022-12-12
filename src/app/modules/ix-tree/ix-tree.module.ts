import { ScrollingModule } from '@angular/cdk/scrolling';
import { CdkTreeModule } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTreeNodeComponent } from 'app/modules/ix-tree/components/ix-tree-node/ix-tree-node.component';
import { IxTreeViewComponent } from 'app/modules/ix-tree/components/ix-tree-view/ix-tree-view.component';
import { IxTreeVirtualScrollViewComponent } from 'app/modules/ix-tree/components/ix-tree-virtual-scroll-view/ix-tree-virtual-scroll-view.component';
import { IxTreeVirtualScrollNodeOutletDirective } from 'app/modules/ix-tree/directives/ix-tree-virtual-scroll-node-outlet.directive';
import { IxNestedTreeNodeComponent } from './components/ix-nested-tree-node/ix-nested-tree-node.component';
import { IxTreeNodeDefDirective } from './directives/ix-tree-node-def.directive';
import { IxTreeNodeOutletDirective } from './directives/ix-tree-node-outlet.directive';
import { IxTreeNodePaddingDirective } from './directives/ix-tree-node-padding-def.directive';
import { IxTreeNodeToggleDirective } from './directives/ix-tree-node-toggle.directive';

@NgModule({
  imports: [
    CdkTreeModule,
    CommonModule,
    IxIconModule,
    MatButtonModule,
    MatTreeModule,
    MatTooltipModule,
    TranslateModule,
    ScrollingModule,
  ],
  declarations: [
    IxTreeNodeComponent,
    IxNestedTreeNodeComponent,
    IxTreeNodeDefDirective,
    IxTreeNodeOutletDirective,
    IxTreeNodeToggleDirective,
    IxTreeVirtualScrollViewComponent,
    IxTreeVirtualScrollNodeOutletDirective,
    IxTreeNodePaddingDirective,
    IxTreeViewComponent,
  ],
  exports: [
    IxTreeNodeComponent,
    IxNestedTreeNodeComponent,
    IxTreeNodeDefDirective,
    IxTreeNodeOutletDirective,
    IxTreeNodeToggleDirective,
    IxTreeVirtualScrollViewComponent,
    IxTreeVirtualScrollNodeOutletDirective,
    IxTreeNodePaddingDirective,
    IxTreeViewComponent,
  ],
})
export class IxTreeModule { }
