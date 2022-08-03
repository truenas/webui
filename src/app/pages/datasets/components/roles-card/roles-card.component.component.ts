import { Component, Input } from '@angular/core';
import { DatasetDetails } from 'app/interfaces/dataset.interface';

@Component({
  selector: 'ix-roles-card',
  templateUrl: './roles-card.component.component.html',
  styleUrls: ['./roles-card.component.component.scss'],
})
export class RolesCardComponent {
  @Input() dataset: DatasetDetails;

  @Input() hasChildrenWithShares = false;

  get smbSharesNames(): string {
    if (!this.dataset.smb_shares?.length) {
      return '';
    }
    return '\'' + this.dataset.smb_shares.map((item) => item.share_name).join('\', \'') + '\'';
  }
}
