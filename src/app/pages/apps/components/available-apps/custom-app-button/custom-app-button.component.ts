import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, inject, signal, viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnIconButtonComponent, TnMenuComponent, TnMenuItemComponent,
  TnMenuTriggerDirective, TnSidePanelActionDirective, TnSidePanelComponent, TnTooltipDirective,
} from '@truenas/ui-components';
import { map } from 'rxjs';
import { customAppTrain, customApp } from 'app/constants/catalog.constants';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { sidePanelFormCloseGuard } from 'app/modules/slide-ins/side-panel-form.directive';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
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
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    CustomAppFormComponent,
  ],
})
export class CustomAppButtonComponent {
  private dockerStore = inject(DockerStore);
  private router = inject(Router);
  private unsavedChanges = inject(UnsavedChangesService);

  protected readonly requiredRoles = [Role.AppsWrite];
  protected readonly searchableElements = customAppButtonElements;

  protected readonly customAppOpen = signal(false);
  protected readonly customAppForm = viewChild(CustomAppFormComponent);
  protected readonly customAppCloseGuard = sidePanelFormCloseGuard(this.unsavedChanges, this.customAppForm);

  customAppDisabled$ = this.dockerStore.selectedPool$.pipe(
    map((pool) => !pool),
  );

  openAppWizardCreation(): void {
    this.router.navigate(['/apps', 'available', customAppTrain, customApp, 'install']);
  }

  openCustomAppYamlCreation(): void {
    this.customAppOpen.set(true);
  }

  // The form routes to the installed app on success, so the host only closes the panel.
  protected onCustomAppClosed(): void {
    this.customAppOpen.set(false);
  }
}
