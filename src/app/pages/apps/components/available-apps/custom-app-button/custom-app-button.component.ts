import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnIconButtonComponent, TnMenuComponent, TnMenuItemComponent,
  TnMenuTriggerDirective, TnTooltipDirective,
} from '@truenas/ui-components';
import { map } from 'rxjs';
import { customAppTrain, customApp } from 'app/constants/catalog.constants';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { customAppButtonElements } from 'app/pages/apps/components/available-apps/custom-app-button/custom-app-button.elements';
import { CustomAppFormComponent } from 'app/pages/apps/components/custom-app-form/custom-app-form.component';
import { DockerStore } from 'app/pages/apps/store/docker.store';

@Component({
  selector: 'ix-custom-app-button',
  templateUrl: './custom-app-button.component.html',
  styleUrls: ['./custom-app-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnTooltipDirective,
    TnButtonComponent,
    RequiresRolesDirective,
    UiSearchDirective,
    TranslateModule,
    TnMenuComponent,
    TnMenuItemComponent,
    AsyncPipe,
    TnIconButtonComponent,
    TnMenuTriggerDirective,
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
    this.slideIn.open(CustomAppFormComponent, { wide: true })
      .onSuccess(() => this.router.navigate(['/apps']), this.destroyRef);
  }
}
