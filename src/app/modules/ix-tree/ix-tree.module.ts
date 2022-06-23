import { CdkTreeModule } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeModule } from '@angular/material/tree';
import { TranslateModule } from '@ngx-translate/core';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { IxNestedTreeNodeComponent } from './components/ix-nested-tree-node/ix-nested-tree-node.component';
import { IxTreeNodeComponent } from './components/ix-tree-node/ix-tree-node.component';
import { IxTreeComponent } from './components/ix-tree/ix-tree.component';
import { IxTreeNodeDefDirective } from './directives/ix-tree-node-def.directive';
import { IxTreeNodeOutletDirective } from './directives/ix-tree-node-outlet.directive';
import { IxTreeNodeToggleDirective } from './directives/ix-tree-node-toggle.directive';

@NgModule({
  imports: [
    CommonModule,
    AppCommonModule,
    CdkTreeModule,
    MatIconModule,
    MatTreeModule,
    MatButtonModule,
    TranslateModule,
    FlexLayoutModule,
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
