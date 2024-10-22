import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardTitle, MatCardContent, MatCardActions,
} from '@angular/material/card';
import { MatListItemIcon, MatListItemLine } from '@angular/material/list';
import { MatProgressBar } from '@angular/material/progress-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ReadOnlyComponent } from 'app/modules/forms/ix-forms/components/readonly-badge/readonly-badge.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { DualListboxComponent } from 'app/modules/lists/dual-list/dual-list.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/services/api.service';
import { AuthService } from 'app/services/auth/auth.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-group-members',
  templateUrl: './group-members.component.html',
  styleUrls: ['./group-members.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatProgressBar,
    MatCardTitle,
    ReadOnlyComponent,
    MatCardContent,
    DualListboxComponent,
    IxIconComponent,
    MatListItemIcon,
    MatListItemLine,
    MatCardActions,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    AsyncPipe,
  ],
})
export class GroupMembersComponent implements OnInit {
  protected readonly requiredRoles = [Role.AccountWrite];

  members: User[] = [];
  selectedMembers: User[] = [];
  users: User[] = [];

  isFormLoading = false;
  group: Group;

  get hasRequiredRoles(): Observable<boolean> {
    return this.authService.hasRole(this.requiredRoles);
  }

  constructor(
    private ws: ApiService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private dialog: DialogService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;
    this.activatedRoute.params.pipe(
      switchMap((params) => {
        return this.ws.call('group.query', [[['id', '=', parseInt(params.pk as string)]]]);
      }),
      switchMap((groups) => {
        this.group = groups[0];
        this.cdr.markForCheck();
        return this.ws.call('user.query');
      }),
      untilDestroyed(this),
    ).subscribe((users) => {
      this.users = users;
      const members = users.filter((user) => this.group.users.includes(user.id));
      this.members = members;
      this.selectedMembers = members;
      this.isFormLoading = false;
      this.cdr.markForCheck();
    });
  }

  onCancel(): void {
    this.router.navigate(['/', 'credentials', 'groups']);
  }

  onSubmit(): void {
    this.isFormLoading = true;
    this.cdr.markForCheck();

    const userIds = this.selectedMembers.map((user) => user.id);
    this.ws.call('group.update', [this.group.id, { users: userIds }]).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.router.navigate(['/', 'credentials', 'groups']);
      },
      error: (error) => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.dialog.error(this.errorHandler.parseError(error));
      },
    });
  }
}
