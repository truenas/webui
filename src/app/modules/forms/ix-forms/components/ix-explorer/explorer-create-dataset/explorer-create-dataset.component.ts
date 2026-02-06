import { ChangeDetectionStrategy, Component, DestroyRef, input, computed, signal, AfterViewInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgControl } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { Dataset, DatasetCreate } from 'app/interfaces/dataset.interface';
import { CreateDatasetDialog } from 'app/modules/forms/ix-forms/components/ix-explorer/create-dataset-dialog/create-dataset-dialog.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

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

  readonly datasetProperties = input<Omit<DatasetCreate, 'name'>>({});

  protected readonly requiredRoles = [Role.DatasetWrite];

  private isExplorerDisabled = computed(() => this.explorer.isDisabled());
  private hasValidParent = computed(() => !!this.parent());
  private isPathMatchingSelection = computed(() => {
    const currentValue = this.explorerValue();
    const selectedPath = Array.isArray(currentValue) ? currentValue[0] : currentValue;
    return this.explorer.lastSelectedNode()?.data.path === selectedPath;
  });

  protected isButtonDisabled = computed(() => this.isExplorerDisabled()
    || !this.hasValidParent()
    || !this.isPathMatchingSelection()
    || !this.explorer.lastSelectedNode()?.data.isMountpoint);

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

  private parent = computed(() => {
    const value = this.explorerValue();
    const selected = Array.isArray(value) ? value[0] : value;
    return selected ? selected.replace(/^(\/mnt\/?)/, '') : null;
  });

  protected onCreateDataset(): void {
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
      }
      this.ngControl?.control?.setValue(dataset.mountpoint);
    });
  }
}
