import {
  ChangeDetectionStrategy, Component, computed, inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnIconButtonComponent, TnMenuComponent, TnMenuItemComponent,
  TnMenuTriggerDirective, TnTooltipDirective,
} from '@truenas/ui-components';
import { customAppTrain, customApp } from 'app/constants/catalog.constants';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
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
    TnIconButtonComponent,
    TnMenuTriggerDirective,
  ],
})
export class CustomAppButtonComponent {
  private dockerStore = inject(DockerStore);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);

  protected readonly requiredRoles = [Role.AppsWrite];
  protected readonly searchableElements = customAppButtonElements;

  protected readonly customAppDisabled = computed(() => !this.dockerStore.selectedPool());

  openAppWizardCreation(): void {
    this.router.navigate(['/apps', 'available', customAppTrain, customApp, 'install']);
  }

  openCustomAppYamlCreation(): void {
    this.formPanel.open(CustomAppFormComponent, {
      title: this.translate.instant('Install via YAML'),
      wide: true,
      testId: 'custom-app',
    });
  }
}
