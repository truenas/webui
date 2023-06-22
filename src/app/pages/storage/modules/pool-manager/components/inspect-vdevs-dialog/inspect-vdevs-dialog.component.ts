import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CreateVdevLayout, VdevType, vdevTypeLabels } from 'app/enums/v-dev-type.enum';
import {
  ManualSelectionVdev,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/interfaces/manual-disk-selection.interface';
import {
  vdevsToManualSelectionVdevs,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/utils/vdevs-to-manual-selection-vdevs.utils';
import {
  PoolManagerTopology,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@Component({
  templateUrl: './inspect-vdevs-dialog.component.html',
  styleUrls: ['./inspect-vdevs-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InspectVdevsDialogComponent implements OnInit {
  protected presentTypes: VdevType[] = [];
  protected selectedType: VdevType;
  protected vdevs: ManualSelectionVdev[] = [];
  protected layout: CreateVdevLayout;

  constructor(
    @Inject(MAT_DIALOG_DATA) public topology: PoolManagerTopology,
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
    const selectedCategory = this.topology[type];
    this.layout = selectedCategory.layout;
    this.vdevs = vdevsToManualSelectionVdevs(selectedCategory.vdevs);
  }

  private setPresentTypes(): void {
    this.presentTypes = Object.keys(this.topology).filter((type) => {
      return this.topology[type as VdevType].vdevs.length > 0;
    }) as VdevType[];
  }
}
