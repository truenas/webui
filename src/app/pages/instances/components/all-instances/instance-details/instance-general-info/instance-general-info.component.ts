import { KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardActions, MatCardContent, MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, map, switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { InstanceEditFormComponent } from 'app/pages/instances/components/all-instances/instance-details/instance-general-info/instance-edit-form/instance-edit-form.component';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-general-info',
  templateUrl: './instance-general-info.component.html',
  styleUrls: ['./instance-general-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatCard,
    MatCardTitle,
    MatCardHeader,
    MatCardActions,
    MatCardContent,
    TranslateModule,
    YesNoPipe,
    RequiresRolesDirective,
    KeyValuePipe,
    TestDirective,
    MatTooltip,
  ],
})
export class InstanceGeneralInfoComponent {
  protected formatter = inject(IxFormatterService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  private slideIn = inject(SlideIn);
  private instancesStore = inject(VirtualizationInstancesStore);

  instance = input.required<VirtualizationInstance>();

  protected readonly Role = Role;

  protected readonly environmentVariablesTooltip = computed(() => {
    return Object.entries(this.instance().environment).map(([key, value]) => `${key} = ${value}`).join('\n');
  });

  editInstance(): void {
    this.slideIn.open(InstanceEditFormComponent, { data: this.instance() })
      .pipe(map((response) => response.response), filter(Boolean), untilDestroyed(this))
      .subscribe((instance: VirtualizationInstance) => {
        this.instancesStore.instanceUpdated(instance);
        this.instancesStore.selectInstance(instance.id);
      });
  }

  deleteInstance(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Delete'),
      message: this.translate.instant('Delete {name}?', { name: this.instance().name }),
      buttonColor: 'warn',
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.dialogService.jobDialog(
          this.api.job('virt.instance.delete', [this.instance().id]),
        ).afterClosed();
      }),
      this.errorHandler.withErrorHandler(),
      untilDestroyed(this),
    ).subscribe(() => {
      this.router.navigate(['/containers'], { state: { hideMobileDetails: true } });
    });
  }
}
