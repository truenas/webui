import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatNavList, MatListItem } from '@angular/material/list';
import { TranslateModule } from '@ngx-translate/core';
import { CreateVdevLayout, VdevType, vdevTypeLabels } from 'app/enums/v-dev-type.enum';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ManualSelectionVdevComponent } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/manual-selection-vdev/manual-selection-vdev.component';
import {
  ManualSelectionVdev,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/interfaces/manual-disk-selection.interface';
import { ManualDiskDragToggleStore } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-drag-toggle.store';
import { ManualDiskSelectionStore } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-selection.store';
import {
  vdevsToManualSelectionVdevs,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/utils/vdevs-to-manual-selection-vdevs.utils';
import {
  PoolManagerTopology,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@Component({
  selector: 'ix-inspect-vdevs-dialog',
  templateUrl: './inspect-vdevs-dialog.component.html',
  styleUrls: ['./inspect-vdevs-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    MatNavList,
    MatListItem,
    MatDivider,
    MatIconButton,
    MatDialogClose,
    TestDirective,
    IxIconComponent,
    ManualSelectionVdevComponent,
    TranslateModule,
  ],
  providers: [
    ManualDiskSelectionStore,
    ManualDiskDragToggleStore,
  ],
})
export class InspectVdevsDialogComponent implements OnInit {
  protected presentTypes: VdevType[] = [];
  protected selectedType: VdevType;
  protected vdevs: ManualSelectionVdev[] = [];
  protected layout: CreateVdevLayout;

  constructor(
    @Inject(MAT_DIALOG_DATA) protected data: { topology: PoolManagerTopology; enclosures: Enclosure[] },
  ) {}

  getTypeLabel(type: VdevType): string {
    return vdevTypeLabels.get(type);
  }

  ngOnInit(): void {
    this.setPresentTypes();
    this.selectType(this.presentTypes[0]);
  }

  selectType(type: VdevType): void {
    this.selectedType = type;
    const selectedCategory = this.data.topology[type];
    this.layout = selectedCategory.layout;
    this.vdevs = vdevsToManualSelectionVdevs(selectedCategory.vdevs);
  }

  private setPresentTypes(): void {
    this.presentTypes = Object.keys(this.data.topology).filter((type) => {
      return this.data.topology[type as VdevType].vdevs.length > 0;
    }) as VdevType[];
  }
}
