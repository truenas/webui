import { inject, Pipe, PipeTransform } from '@angular/core';
import { datasetsRootNode } from 'app/constants/basic-root-nodes.constant';
import { ExplorerNodeData } from 'app/interfaces/tree-node.interface';
import { TreeNodeProvider } from 'app/modules/forms/file-picker/tree-node-provider.interface';
import { TreeNodeSource } from 'app/modules/forms/file-picker/tree-node-source';
import { ErrorParserService } from 'app/services/errors/error-parser.service';

/**
 * Builds a `tn-file-picker` `[source]` from a middleware {@link TreeNodeProvider}:
 *
 * ```html
 * <tn-file-picker formControlName="path" [source]="treeNodeProvider | filePickerSource" />
 * <tn-file-picker formControlName="dataset" [source]="provider | filePickerSource : [emptyRootNode]" />
 * ```
 *
 * Pure, so a new source (with a fresh listing cache) is built only when the provider or the
 * root nodes change.
 */
@Pipe({
  name: 'filePickerSource',
})
export class FilePickerSourcePipe implements PipeTransform {
  private errorParser = inject(ErrorParserService);

  transform(
    provider: TreeNodeProvider | undefined,
    rootNodes: ExplorerNodeData[] = [datasetsRootNode],
  ): TreeNodeSource {
    return new TreeNodeSource(provider, rootNodes, (error) => this.errorParser.getFirstErrorMessage(error));
  }
}
