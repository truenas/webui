import {Component, OnInit} from '@angular/core';
import {RestService} from "../../../../services/rest.service";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {WebSocketService} from "../../../../services/ws.service";

@Component({
  selector: 'app-members',
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.css']
})
export class MembersComponent implements OnInit {

  members: any[] = [];
  selectedMembers: any[] = [];
  group = {
    id: '',
    name: ''
  };
  users: any[] = [];

  constructor(private rest: RestService,
              private ws: WebSocketService,
              private activatedRoute: ActivatedRoute,
              private router: Router) {
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe((res: Params) => this.group.id = res.pk);
    //this.getGroupDetails();
    this.getMembers();
  }

  getGroupDetails() {
    this.ws.call('group.query').subscribe(res => {
      const groupUsersDetails = res.find(x => x.id == this.group.id);
      if (groupUsersDetails) {
        for (const user of groupUsersDetails.users) {
          const usr = this.members.find(x => x.id == user);
          this.addToSelectedMembers(usr, false);
        }
      }
    }, err => {
      console.log('group err', err);
    })
  }

  getMembers() {
    let users = this.rest.get(`/account/users/`, {});
    users.flatMap(res => {
      return this.rest.get(`/account/users/`, {limit: res.total})
    }).subscribe(res => {
      this.members = res.data;
      this.getGroupDetails();
    }, err => {
      console.log(err);
    })
  }

  cancel() {
    this.router.navigate(['/', 'account', 'groups']);
  }

  OnItemChange(event) {

    console.log('sel mem ---> ', this.selectedMembers);

    // for(const item of event.items) {
    //   console.log('---------item--------');
    //   //const found = this.selectedMembers.find(x => x.id == item.id);
    //   console.log('i ---->', found);
    // }

    //this.addToSelectedMembers(event.items, true);
  }

  updateUsers() {
    let body = [
      this.group.name
    ];
    let user = this.rest.get(`account/users/1/groups/`, {});
    user.subscribe(res => {
      console.log('this is the res', res);
    }, err => console.log(err))
  }

  addToSelectedMembers(payload, isArray) {
    if (!isArray) {
      this.selectedMembers.push(payload);
    } else {
      this.selectedMembers.concat(...payload);
    }
    this.selectedMembers = this.selectedMembers.filter(this.onlyUnique);

    console.log('selected', this.selectedMembers);

  }

  onlyUnique = (value, index, self) => ( self.indexOf(value) === index )
}
