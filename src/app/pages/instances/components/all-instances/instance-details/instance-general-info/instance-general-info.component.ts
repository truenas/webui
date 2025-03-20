import { KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
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
import { VirtualizationType } from 'app/enums/virtualization.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { InstanceEditFormComponent } from 'app/pages/instances/components/all-instances/instance-details/instance-general-info/instance-edit-form/instance-edit-form.component';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-general-info',
  templateUrl: './instance-general-info.component.html',
  styleUrls: ['./instance-general-info.component.scss'],
  standalone: true,
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
  instance = input.required<VirtualizationInstance>();

  protected readonly Role = Role;

  protected readonly environmentVariablesTooltip = computed(() => {
    return Object.entries(this.instance().environment).map(([key, value]) => `${key} = ${value}`).join('\n');
  });

  protected readonly isVm = computed(() => this.instance().type === VirtualizationType.Vm);

  constructor(
    protected formatter: IxFormatterService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private slideIn: SlideIn,
    private instancesStore: VirtualizationInstancesStore,
    private deviceStore: VirtualizationDevicesStore,
  ) {}

  editInstance(): void {
    this.slideIn.open(InstanceEditFormComponent, { data: this.instance() })
      .pipe(map((response) => response.response), filter(Boolean), untilDestroyed(this))
      .subscribe((instance: VirtualizationInstance) => {
        this.instancesStore.instanceUpdated(instance);
        this.deviceStore.selectInstance(instance.id);
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
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe(() => {
      this.router.navigate(['/instances'], { state: { hideMobileDetails: true } });
    });
  }
}
