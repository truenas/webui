import {
  Component,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  styleUrls: ['./app-upgrade-dialog.component.scss'],
  templateUrl: './app-upgrade-dialog.component.html',
})
export class AppUpgradeDialogComponent {
}
