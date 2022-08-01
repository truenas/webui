import { Component, Input, OnChanges } from '@angular/core';
import { DatasetDetails } from 'app/interfaces/dataset.interface';

@Component({
  selector: 'ix-roles-card',
  templateUrl: './roles-card.component.component.html',
  styleUrls: ['./roles-card.component.component.scss'],
})
export class RolesCardComponent implements OnChanges {
  @Input() dataset: DatasetDetails;

  hasChildrenWithShares = false;

  get smbSharesNames(): string {
    if (!this.dataset.smb_shares?.length) {
      return '';
    }
    return '\'' + this.dataset.smb_shares.map((item) => item.share_name).join('\', \'') + '\'';
  }

  ngOnChanges(): void {
    this.hasChildrenWithShares = this.checkDatasetForChildrenWithShares(this.dataset);
  }

  checkDatasetForChildrenWithShares(dataset: DatasetDetails): boolean {
    if (!dataset.children?.length) {
      return false;
    }
    for (const child of dataset.children) {
      if (this.datasetOrChildrenHaveShares(child)) {
        return true;
      }
    }
    return false;
  }

  datasetOrChildrenHaveShares(dataset: DatasetDetails): boolean {
    if (dataset.nfs_shares?.length
            || dataset.smb_shares?.length
            || dataset.iscsi_shares?.length
    ) {
      return true;
    }
    for (const child of dataset.children) {
      if (this.datasetOrChildrenHaveShares(child)) {
        return true;
      }
    }
    return false;
  }
}
