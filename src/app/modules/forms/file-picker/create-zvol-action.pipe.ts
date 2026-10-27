import { inject, Pipe, PipeTransform } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { FilePickerCreateAction } from '@truenas/ui-components';
import { firstValueFrom, map } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { zvolPath } from 'app/helpers/storage.helper';
import { helptextZvol } from 'app/helptext/storage/volumes/zvol-form';
import { Dataset } from 'app/interfaces/dataset.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { TreeNodeSource } from 'app/modules/forms/file-picker/tree-node-source';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';

/**
 * A "Create Zvol" action for a `tn-file-picker` browsing `/dev/zvol` (`[zvolsRootNode]`): it
 * opens the zvol form for the browsed dataset, and the picker selects the zvol it creates.
 *
 * ```html
 * @let zvolSource = zvolProvider | filePickerSource : [zvolsRootNode];
 * <tn-file-picker
 *   formControlName="device_path"
 *   [source]="zvolSource"
 *   [createActions]="[zvolSource | createZvolAction]"
 * />
 * ```
 */
@Pipe({
  name: 'createZvolAction',
})
export class CreateZvolActionPipe implements PipeTransform {
  private formPanel = inject(FormSidePanelService);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);

  // Read inside the picker's `canCreateAt` evaluation, so a role that arrives later re-runs it.
  private canCreate = toSignal(this.authService.hasRole([Role.DatasetWrite]), { initialValue: false });

  transform(source: TreeNodeSource): FilePickerCreateAction {
    return {
      id: 'create-zvol',
      label: this.translate.instant('Create Zvol'),
      canCreateAt: (parentPath) => this.canCreate() && !!this.toParentId(source.fromPickerPath(parentPath)),
      run: async (parentPath) => {
        const zvol = await this.create(source.fromPickerPath(parentPath));
        return zvol ? source.toPickerPath(zvol) : null;
      },
    };
  }

  private create(parentPath: string): Promise<string | null> {
    const parent = this.toParentId(parentPath);
    // `canCreateAt` already covers this, but `inputs` is an untyped bag: without the guard a
    // null would flow into `ZvolFormComponent.params.parentOrZvolId`, which is a required string.
    if (!parent) {
      return Promise.resolve(null);
    }

    return firstValueFrom(this.formPanel.open<Dataset>(ZvolFormComponent, {
      title: this.translate.instant(helptextZvol.addTitle),
      inputs: {
        params: {
          isNew: true,
          parentOrZvolId: parent,
        },
      },
    }).pipe(
      map(({ response }) => (response ? `${zvolPath}/${response.id}` : null)),
    ));
  }

  /** Zvols can only be created under a dataset inside /dev/zvol, not at its top. */
  private toParentId(parentPath: string): string | null {
    if (!parentPath.startsWith(`${zvolPath}/`)) {
      return null;
    }
    return parentPath.slice(zvolPath.length + 1) || null;
  }
}
