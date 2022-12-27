import { CdkTreeModule } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTreeModule } from '@angular/material/tree';
import { IxNestedTreeNodeComponent } from './components/ix-nested-tree-node/ix-nested-tree-node.component';
import { IxTreeNodeComponent } from './components/ix-tree-node/ix-tree-node.component';
import { IxTreeComponent } from './components/ix-tree/ix-tree.component';
import { IxTreeNodeDefDirective } from './directives/ix-tree-node-def.directive';
import { IxTreeNodeOutletDirective } from './directives/ix-tree-node-outlet.directive';
import { IxTreeNodeToggleDirective } from './directives/ix-tree-node-toggle.directive';

@NgModule({
  imports: [
    CommonModule,
    CdkTreeModule,
    MatTreeModule,
    MatButtonModule,
  ],
  declarations: [
    IxTreeNodeComponent,
    IxNestedTreeNodeComponent,
    IxTreeComponent,
    IxTreeNodeDefDirective,
    IxTreeNodeOutletDirective,
    IxTreeNodeToggleDirective,
  ],
  exports: [
    IxTreeComponent,
    IxTreeNodeComponent,
    IxNestedTreeNodeComponent,
    IxTreeNodeDefDirective,
    IxTreeNodeOutletDirective,
    IxTreeNodeToggleDirective,
  ],
})
export class IxTreeModule { }
