import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { filter, map } from 'rxjs';
import { customAppTrain, customApp } from 'app/constants/catalog.constants';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { customAppButtonElements } from 'app/pages/apps/components/available-apps/custom-app-button/custom-app-button.elements';
import { CustomAppFormComponent } from 'app/pages/apps/components/custom-app-form/custom-app-form.component';
import { DockerStore } from 'app/pages/apps/store/docker.store';

@Component({
  selector: 'ix-custom-app-button',
  templateUrl: './custom-app-button.component.html',
  styleUrls: ['./custom-app-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTooltip,
    MatButton,
    RequiresRolesDirective,
    TestDirective,
    UiSearchDirective,
    TranslateModule,
    MatMenu,
    MatMenuItem,
    TnIconComponent,
    AsyncPipe,
    MatIconButton,
    MatMenuTrigger,
  ],
})
export class CustomAppButtonComponent {
  private dockerStore = inject(DockerStore);
  private router = inject(Router);
  private slideIn = inject(SlideIn);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.AppsWrite];
  protected readonly searchableElements = customAppButtonElements;

  customAppDisabled$ = this.dockerStore.selectedPool$.pipe(
    map((pool) => !pool),
  );

  openAppWizardCreation(): void {
    this.router.navigate(['/apps', 'available', customAppTrain, customApp, 'install']);
  }

  openCustomAppYamlCreation(): void {
    this.slideIn.open(CustomAppFormComponent, { wide: true }).pipe(
      filter((result) => !!result.response),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.router.navigate(['/apps']);
      },
    });
  }
}
