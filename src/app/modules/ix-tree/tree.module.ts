import { ScrollingModule } from '@angular/cdk/scrolling';
import { CdkTreeModule } from '@angular/cdk/tree';
import { AsyncPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { TranslateModule } from '@ngx-translate/core';
import { AngularResizeEventModule } from 'angular-resize-event';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { NestedTreeNodeComponent } from 'app/modules/ix-tree/components/nested-tree-node/nested-tree-node.component';
import { TreeNodeComponent } from 'app/modules/ix-tree/components/tree-node/tree-node.component';
import { TreeViewComponent } from 'app/modules/ix-tree/components/tree-view/tree-view.component';
import { TreeVirtualScrollViewComponent } from 'app/modules/ix-tree/components/tree-virtual-scroll-view/tree-virtual-scroll-view.component';
import { TreeNodeDefDirective } from 'app/modules/ix-tree/directives/tree-node-def.directive';
import { TreeNodeOutletDirective } from 'app/modules/ix-tree/directives/tree-node-outlet.directive';
import { TreeNodeToggleDirective } from 'app/modules/ix-tree/directives/tree-node-toggle.directive';
import { TreeVirtualScrollNodeOutletDirective } from 'app/modules/ix-tree/directives/tree-virtual-scroll-node-outlet.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';

const components = [
  NestedTreeNodeComponent,
  TreeNodeComponent,
  TreeNodeDefDirective,
  TreeNodeOutletDirective,
  TreeNodeToggleDirective,
  TreeViewComponent,
  TreeVirtualScrollNodeOutletDirective,
  TreeVirtualScrollViewComponent,
];

@NgModule({
  imports: [
    CdkTreeModule,
    IxIconComponent,
    MatButtonModule,
    MatTooltipModule,
    MatTreeModule,
    ScrollingModule,
    TranslateModule,
    AngularResizeEventModule,
    AsyncPipe,
    TestDirective,
  ],
  declarations: [
    ...components,
  ],
  exports: [
    ...components,
  ],
})
export class TreeModule { }
