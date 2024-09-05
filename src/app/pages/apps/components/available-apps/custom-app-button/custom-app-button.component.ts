import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map, tap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { customAppButtonElements } from 'app/pages/apps/components/available-apps/custom-app-button/custom-app-button.elements';
import { CustomAppFormComponent } from 'app/pages/apps/components/custom-app-form/custom-app-form.component';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-custom-app-button',
  templateUrl: './custom-app-button.component.html',
  styleUrls: ['./custom-app-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomAppButtonComponent {
  protected readonly requiredRoles = [Role.AppsWrite];
  protected readonly searchableElements = customAppButtonElements;

  customAppDisabled$ = this.dockerStore.selectedPool$.pipe(
    map((pool) => !pool),
  );

  constructor(
    private dockerStore: DockerStore,
    private router: Router,
    private ixSlideIn: IxSlideInService,
  ) { }

  navigateToCustomAppCreation(): void {
    const ref = this.ixSlideIn.open(CustomAppFormComponent, { wide: true });
    ref.slideInClosed$.pipe(
      tap(Boolean),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.router.navigate(['/', 'apps']);
      },
    });
  }
}
