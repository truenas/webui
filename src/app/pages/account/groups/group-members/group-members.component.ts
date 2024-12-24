import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AuthService } from 'app/services/auth/auth.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-group-members',
  templateUrl: './group-members.component.html',
  styleUrls: ['./group-members.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    private ws: WebSocketService,
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
        return this.ws.call('user.query', [[['local', '=', true]]]);
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
