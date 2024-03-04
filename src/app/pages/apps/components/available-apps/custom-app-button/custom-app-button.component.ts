import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { chartsTrain, ixChartApp, officialCatalog } from 'app/constants/catalog.constants';
import { Role } from 'app/enums/role.enum';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';

@Component({
  selector: 'ix-custom-app-button',
  templateUrl: './custom-app-button.component.html',
  styleUrls: ['./custom-app-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomAppButtonComponent {
  protected requiredRoles = [Role.AppsWrite];

  customAppDisabled$ = this.kubernetesStore.selectedPool$.pipe(
    map((pool) => !pool),
  );

  constructor(private kubernetesStore: KubernetesStore, private router: Router) {}

  navigateToCustomAppCreation(): void {
    this.router.navigate(['/apps', 'available', officialCatalog, chartsTrain, ixChartApp, 'install']);
  }
}
