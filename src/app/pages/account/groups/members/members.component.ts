import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { mergeMap } from 'rxjs/operators';
import helptext from 'app/helptext/account/members';
import { Group } from 'app/interfaces/group.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'app-members',
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.scss'],
})
export class MembersComponent implements OnInit {
  members: User[] = [];
  selectedMembers: User[] = [];
  users: User[] = [];

  groupId = '';
  groupName = '';
  showSpinner = true;

  constructor(
    private loading: AppLoaderService,
    private ws: WebSocketService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.pipe(untilDestroyed(this)).subscribe((params: Params) => this.groupId = params.pk);
    this.getGroupDetails();
  }

  getGroupDetails(): void {
    let myFilter: QueryFilter<Group | User> = ['id', '=', parseInt(this.groupId)];
    const group$ = this.ws.call('group.query', [[myFilter]]);

    group$.pipe(mergeMap((group) => {
      myFilter = ['id', 'in', group[0].users];
      this.groupName = group[0].group;
      return this.ws.call('user.query', [[myFilter]]);
    })).pipe(untilDestroyed(this)).subscribe((users) => {
      this.users = users;
      this.selectedMembers = users;
      this.getMembers();
    });
  }

  getMembers(): void {
    this.ws.call('user.query').pipe(untilDestroyed(this)).subscribe((users) => {
      for (const user of users) {
        const idx = this.users.findIndex((x) => user.id === x.id);
        if (idx === -1) {
          this.members.push(user);
        }
      }
    });

    this.showSpinner = false;
  }

  cancel(): void {
    this.router.navigate(['/', 'credentials', 'groups']);
  }

  updateUsers(): void {
    this.loading.open(this.translate.instant(helptext.update_users_message));

    const userIds = this.selectedMembers.map((user) => user.id);
    this.ws.call('group.update', [Number(this.groupId), { users: userIds }]).pipe(untilDestroyed(this)).subscribe(() => {
      this.router.navigate(['/', 'credentials', 'groups']);
      this.loading.close();
    });
  }
}
