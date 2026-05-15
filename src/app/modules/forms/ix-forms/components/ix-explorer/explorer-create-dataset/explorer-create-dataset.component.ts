import { ChangeDetectionStrategy, Component, DestroyRef, input, computed, signal, AfterViewInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgControl } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DatasetPreset } from 'app/enums/dataset.enum';
import { Role } from 'app/enums/role.enum';
import { Dataset, DatasetCreate } from 'app/interfaces/dataset.interface';
import { CreateDatasetDialog } from 'app/modules/forms/ix-forms/components/ix-explorer/create-dataset-dialog/create-dataset-dialog.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

export const genericCreateDatasetProps: Omit<DatasetCreate, 'name'> = {
  share_type: DatasetPreset.Generic,
};

@Component({
  selector: 'ix-explorer-create-dataset',
  templateUrl: './explorer-create-dataset.component.html',
  styleUrls: ['./explorer-create-dataset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButton,
    TnIconComponent,
    TranslateModule,
    RequiresRolesDirective,
    TestDirective,
  ],
})
export class ExplorerCreateDatasetComponent implements AfterViewInit {
  private explorer = inject(IxExplorerComponent);
  private matDialog = inject(MatDialog);
  private ngControl = inject(NgControl);
  private destroyRef = inject(DestroyRef);

  readonly datasetProperties = input<Omit<DatasetCreate, 'name'>>(genericCreateDatasetProps);

  protected readonly requiredRoles = [Role.DatasetWrite];

  private isExplorerDisabled = computed(() => this.explorer.isDisabled());
  private hasValidParent = computed(() => {
    const parent = this.parent();
    // After stripping the /mnt/ prefix, a real dataset path is either bare ("tank") or
    // nested ("tank/foo"). A leading slash means the selection isn't under /mnt/ (e.g.
    // /dev/zvol/<pool>) and pool.dataset.create would reject it.
    return !!parent && !parent.startsWith('/');
  });

  private isMultiSelect = computed(() => Array.isArray(this.explorerValue()));
  private isSingleSelectionPresent = computed(() => {
    const currentValue = this.explorerValue();
    if (Array.isArray(currentValue)) {
      // The explorer clears lastSelectedNode when the most recently clicked node is
      // deselected, so we can't rely on it in multi-select mode. Selections in the
      // form value can only come from tree-node clicks or paths that resolved to a
      // tree node, so accept the first value as the parent when exactly one is left.
      return currentValue.length === 1;
    }
    return !!currentValue && this.explorer.lastSelectedNode()?.data.path === currentValue;
  });

  protected isButtonDisabled = computed(() => {
    if (this.isExplorerDisabled() || !this.hasValidParent() || !this.isSingleSelectionPresent()) {
      return true;
    }
    if (this.isMultiSelect()) {
      return false;
    }
    return !this.explorer.lastSelectedNode()?.data.isMountpoint;
  });

  protected explorerValue = signal<string | string[]>('');

  ngAfterViewInit(): void {
    // NgControl is not initialized at construction time — it's only available after view init.
    // We listen to control value changes here to sync explorerValue for button logic.
    this.ngControl.control?.valueChanges?.pipe(
      takeUntilDestroyed(this.destroyRef),
    )?.subscribe((value: string | string[]) => {
      this.explorerValue.set(value);
    });
  }

  private parentPath = computed(() => {
    const value = this.explorerValue();
    return Array.isArray(value) ? value[0] : value;
  });

  private parent = computed(() => {
    const selected = this.parentPath();
    return selected ? selected.replace(/^(\/mnt\/?)/, '') : null;
  });

  protected onCreateDataset(): void {
    const parentPath = this.parentPath();
    this.matDialog.open(CreateDatasetDialog, {
      data: {
        parentId: this.parent(),
        dataset: this.datasetProperties(),
      },
    }).afterClosed().pipe(
      filter(Boolean),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((dataset: Dataset) => {
      const node = this.explorer.lastSelectedNode();
      if (node) {
        this.explorer.refreshNode(node);
      } else if (parentPath) {
        this.explorer.refreshNodeByPath(parentPath);
      }

      const control = this.ngControl?.control;
      const currentValue = control?.value;
      if (Array.isArray(currentValue)) {
        const updatedValue = currentValue.map(
          (path) => (path === parentPath ? dataset.mountpoint : path),
        );
        control?.setValue(updatedValue);
      } else {
        control?.setValue(dataset.mountpoint);
      }
    });
  }
}
