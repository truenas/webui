import { ChangeDetectionStrategy, Component, Host, input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { Dataset, DatasetCreate } from 'app/interfaces/dataset.interface';
import { CreateDatasetDialog } from 'app/modules/forms/ix-forms/components/ix-explorer/create-dataset-dialog/create-dataset-dialog.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-explorer-create-dataset',
  templateUrl: './create-dataset.component.html',
  styleUrls: ['./create-dataset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatButton, IxIconComponent, TranslateModule, RequiresRolesDirective, TestDirective],
})
export class IxExplorerCreateDatasetComponent {
  readonly datasetProps = input<Omit<DatasetCreate, 'name'>>({});

  protected readonly requiredRoles = [Role.DatasetWrite];

  constructor(
    @Host() private explorer: IxExplorerComponent,
    private matDialog: MatDialog,
  ) {
  }

  protected get disabled(): boolean {
    const node = this.explorer.getActiveNode();
    return !node?.data.isMountpoint || this.explorer.isDisabled;
  }

  protected onCreateDataset(): void {
    const selected = Array.isArray(this.explorer.value) ? this.explorer.value[0] : this.explorer.value;
    this.matDialog.open(CreateDatasetDialog, {
      data: {
        parentId: this.explorer.parentDatasetName(selected),
        dataset: this.datasetProps(),
      },
    }).afterClosed().pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe((dataset: Dataset) => {
      const node = this.explorer.getActiveNode();
      if (node?.isExpanded) {
        node.collapse();
      }
      if (node) {
        this.explorer.refreshNode(node);
      }
      this.explorer.writeValue(dataset.mountpoint);
      this.explorer.onChange(this.explorer.value);
    });
  }
}
