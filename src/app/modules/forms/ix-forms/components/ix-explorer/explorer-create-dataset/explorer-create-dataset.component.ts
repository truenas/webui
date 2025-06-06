import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgControl } from '@angular/forms';
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
  templateUrl: './explorer-create-dataset.component.html',
  styleUrls: ['./explorer-create-dataset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButton,
    IxIconComponent,
    TranslateModule,
    RequiresRolesDirective,
    TestDirective,
  ],
})
export class ExplorerCreateDatasetComponent {
  readonly datasetProps = input<Omit<DatasetCreate, 'name'>>({});

  protected readonly requiredRoles = [Role.DatasetWrite];

  protected isButtonDisabled = computed(() => {
    const isMountpointSelected = this.explorer.lastSelectedNode()?.data.isMountpoint;
    return this.explorer.isDisabled() || !isMountpointSelected || !this.parent();
  });

  private explorerValue = toSignal<string | string[]>(this.ngControl.valueChanges, { initialValue: null });

  constructor(
    private explorer: IxExplorerComponent,
    private matDialog: MatDialog,
    private ngControl: NgControl,
  ) {}

  private parent = computed(() => {
    const value = this.explorerValue();
    const selected = Array.isArray(value) ? value[0] : value;
    return selected ? selected.replace(/^(\/mnt\/?)/, '') : null;
  });

  protected onCreateDataset(): void {
    this.matDialog.open(CreateDatasetDialog, {
      data: {
        parentId: this.parent(),
        dataset: this.datasetProps(),
      },
    }).afterClosed().pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe((dataset: Dataset) => {
      const node = this.explorer.lastSelectedNode();
      if (node) {
        this.explorer.refreshNode(node);
      }
      this.ngControl.control.setValue(dataset.mountpoint);
    });
  }
}
