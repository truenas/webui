import { QueryFilter } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { mergeMap } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { WebSocketService } from '../../../../services/ws.service';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { TranslateService } from '@ngx-translate/core';
import helptext from '../../../../helptext/account/members';

@Component({
  selector: 'app-members',
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.css'],
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
    this.activatedRoute.params.subscribe((params: Params) => this.groupId = params.pk);
    this.getGroupDetails();
  }

  getGroupDetails(): void {
    let myFilter: QueryFilter<User> = ['id', '=', parseInt(this.groupId)];
    const group$ = this.ws.call('group.query', [[myFilter]]);

    group$.pipe(mergeMap((group) => {
      myFilter = ['id', 'in', group[0].users];
      this.groupName = group[0].group;
      return this.ws.call('user.query', [[myFilter]]);
    })).subscribe((users) => {
      this.users = users;
      this.selectedMembers = users;
      this.getMembers();
    });
  }

  getMembers(): void {
    this.ws.call('user.query').subscribe((users) => {
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
    this.ws.call('group.update', [this.groupId, { users: userIds }]).subscribe(() => {
      this.router.navigate(['/', 'credentials', 'groups']);
      this.loading.close();
    });
  }
}
