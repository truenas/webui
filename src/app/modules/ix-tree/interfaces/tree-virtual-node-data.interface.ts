import { CdkTreeNodeOutletContext, CdkTreeNodeDef } from '@angular/cdk/tree';

export interface IxTreeVirtualNodeData<T> {
  data: T;
  context: CdkTreeNodeOutletContext<T>;
  nodeDef: CdkTreeNodeDef<T>;
}
