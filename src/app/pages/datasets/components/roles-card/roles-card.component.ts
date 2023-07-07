import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import _ from 'lodash';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { ixApplications } from 'app/pages/datasets/utils/dataset.utils';

@Component({
  selector: 'ix-roles-card',
  templateUrl: './roles-card.component.html',
  styleUrls: ['./roles-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesCardComponent {
  @Input() dataset: DatasetDetails;
  @Input() systemDataset: string;
  @Input() hasChildrenWithShares = false;

  get isApplications(): boolean {
    return this.dataset.name && this.dataset.name.endsWith(ixApplications);
  }

  get appsNames(): string {
    return _.uniq(this.dataset.apps.map((app) => app.name)).join(', ');
  }

  get vmsNames(): string {
    return _.uniq(this.dataset.vms.map((app) => app.name)).join(', ');
  }

  get isSystemDataset(): boolean {
    return this.dataset.name === this.systemDataset;
  }

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
