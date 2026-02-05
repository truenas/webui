import {
  ChangeDetectionStrategy, Component, computed, inject, signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { finalize, forkJoin, of } from 'rxjs';
import { containersHelptext } from 'app/helptext/containers/containers';
import { Group } from 'app/interfaces/group.interface';
import { Option } from 'app/interfaces/option.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { User, directIdMapping } from 'app/interfaces/user.interface';
import { IxButtonGroupComponent } from 'app/modules/forms/ix-forms/components/ix-button-group/ix-button-group.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { MappingType, TableRow } from './mapping.types';
import { NewMappingFormComponent } from './new-mapping-form/new-mapping-form.component';

@Component({
  selector: 'ix-map-user-group-ids-dialog',
  templateUrl: './map-user-group-ids-dialog.component.html',
  styleUrls: ['./map-user-group-ids-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    MatProgressSpinner,
    TranslateModule,
    IxIconComponent,
    TestDirective,
    NewMappingFormComponent,
    IxButtonGroupComponent,
    ReactiveFormsModule,
  ],
})
export class MapUserGroupIdsDialogComponent {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private dialogRef = inject(MatDialogRef<MapUserGroupIdsDialogComponent>);

  protected readonly helptext = containersHelptext;
  protected readonly MappingType = MappingType;

  protected selectedType = signal<MappingType>(MappingType.Users);
  protected typeControl = new FormControl<MappingType>(MappingType.Users);
  protected isLoading = signal(false);
  protected users = signal<User[]>([]);
  protected groups = signal<Group[]>([]);

  protected typeOptions$ = of<Option[]>([
    { label: 'Users', value: MappingType.Users },
    { label: 'Groups', value: MappingType.Groups },
  ]);

  protected mappings = computed(() => {
    const type = this.selectedType();
    const entities = type === MappingType.Users ? this.users() : this.groups();

    return entities.map((entity: User | Group): TableRow => {
      const isUser = 'uid' in entity;
      return {
        id: entity.id,
        name: isUser ? (entity as User).username : (entity as Group).name,
        hostId: isUser ? (entity as User).uid : (entity as Group).gid,
        containerId: entity.userns_idmap === directIdMapping ? directIdMapping : entity.userns_idmap,
      };
    });
  });

  constructor() {
    this.loadMappings();

    this.typeControl.valueChanges.subscribe((value) => {
      if (value) {
        this.selectedType.set(value);
      }
    });
  }

  protected onDeleteMapping(row: TableRow): void {
    const isUser = this.selectedType() === MappingType.Users;
    const method = isUser ? 'user.update' : 'group.update';

    this.api.call(method, [row.id, { userns_idmap: null }] as never)
      .pipe(this.errorHandler.withErrorHandler())
      .subscribe(() => {
        this.loadMappings();
      });
  }

  protected onMappingAdded(): void {
    this.loadMappings();
  }

  protected onClose(): void {
    this.dialogRef.close();
  }

  private loadMappings(): void {
    this.isLoading.set(true);

    const userFilters: QueryFilters<User> = [['local', '=', true], ['userns_idmap', '!=', null]];
    const groupFilters: QueryFilters<Group> = [['local', '=', true], ['userns_idmap', '!=', null]];

    forkJoin({
      users: this.api.call('user.query', [userFilters]),
      groups: this.api.call('group.query', [groupFilters]),
    })
      .pipe(
        this.errorHandler.withErrorHandler(),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe(({ users, groups }) => {
        this.users.set(users);
        this.groups.set(groups);
      });
  }
}
