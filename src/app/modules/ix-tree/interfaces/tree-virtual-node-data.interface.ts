import { CdkTreeNodeOutletContext, CdkTreeNodeDef } from '@angular/cdk/tree';

export interface TreeVirtualNodeData<T> {
  data: T;
  context: CdkTreeNodeOutletContext<T>;
  nodeDef: CdkTreeNodeDef<T>;
}
