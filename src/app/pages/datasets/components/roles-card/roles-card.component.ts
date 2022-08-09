import { Component, Input } from '@angular/core';
import { DatasetDetails } from 'app/interfaces/dataset.interface';

@Component({
  selector: 'ix-roles-card',
  templateUrl: './roles-card.component.html',
  styleUrls: ['./roles-card.component.scss'],
})
export class RolesCardComponent {
  @Input() dataset: DatasetDetails;

  @Input() hasChildrenWithShares = false;

  get smbSharesNames(): string {
    if (!this.dataset.smb_shares?.length) {
      return '';
    }
    const shareNames: string[] = this.dataset.smb_shares.map((item) => item.share_name);
    if (shareNames.length === 1) {
      return "'" + shareNames[0] + "'";
    }
    let shareNamesPretty = "'";
    for (let i = 0; i < shareNames.length - 1; i++) {
      if (i + 1 >= shareNames.length - 1) {
        shareNamesPretty += shareNames[i] + "', and '" + shareNames[shareNames.length - 1] + "'";
      } else {
        shareNamesPretty += shareNames[i] + "', '";
      }
    }
    return shareNamesPretty;
  }
}
