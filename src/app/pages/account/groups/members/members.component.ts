import {Component, OnInit} from '@angular/core';
import {RestService} from "../../../../services/rest.service";
import {ActivatedRoute, Params, Router} from "@angular/router";

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

  constructor(private rest: RestService,
              private activatedRoute: ActivatedRoute,
              private router: Router) {
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe((res: Params) => this.group.id = res.pk);
    this.getGroupDetails();
    this.getMembers();
  }

  getGroupDetails() {
   this.rest.get(`/account/groups/${this.group.id}`, {}).subscribe(res => {
     this.group.name = res.data.bsdgrp_group;
   }, err => console.log(err))
  }

  getMembers() {
    let users = this.rest.get(`/account/users/`, {});
    users.flatMap(res => {
      return this.rest.get(`/account/users/`, {limit: res.total})
    }).subscribe(res => {
      this.members = res.data;
    }, err => {
      console.log(err);
    })
  }

  cancel() {
    this.router.navigate(['/', 'account', 'groups']);
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

}
