import {
  Component, ChangeDetectionStrategy, input, computed, output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { VirtualizationStatus, virtualizationStatusMap, virtualizationTypeMap } from 'app/enums/virtualization.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-instance-row',
  templateUrl: './instance-row.component.html',
  styleUrls: ['./instance-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FileSizePipe,
    IxIconComponent,
    MatTooltipModule,
    TestDirective,
    TranslateModule,
    MatButtonModule,
    MatCheckboxModule,
    RequiresRolesDirective,
    MapValuePipe,
  ],
})
export class InstanceRowComponent {
  protected readonly requiredRoles = [Role.VirtInstanceWrite];
  readonly instance = input.required<VirtualizationInstance>();
  readonly selected = input<boolean>(false);

  protected readonly isStopped = computed(() => this.instance().status === VirtualizationStatus.Stopped);

  readonly selectionChange = output();
  readonly onStart = output();
  readonly onStop = output();
  readonly onRestart = output();

  readonly virtualizationTypeMap = virtualizationTypeMap;
  readonly virtualizationStatusMap = virtualizationStatusMap;
}
