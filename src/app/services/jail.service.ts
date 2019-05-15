

import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Observable, Subject, Subscription} from 'rxjs/Rx';

import {EntityUtils} from '../pages/common/entity/utils'
import {RestService} from './rest.service';
import {WebSocketService} from './ws.service';

@Injectable()
export class JailService {
  protected ipv4_netmask_options: any[] = [
    {label : '', value : ''},
    {label : '/32 (255.255.255.255)', value : '32'},
    {label : '/31 (255.255.255.254)', value : '31'},
    {label : '/30 (255.255.255.252)', value : '30'},
    {label : '/29 (255.255.255.248)', value : '29'},
    {label : '/28 (255.255.255.240)', value : '28'},
    {label : '/27 (255.255.255.224)', value : '27'},
    {label : '/26 (255.255.255.192)', value : '26'},
    {label : '/25 (255.255.255.128)', value : '25'},
    {label : '/24 (255.255.255.0)', value : '24'},
    {label : '/23 (255.255.254.0)', value : '23'},
    {label : '/22 (255.255.252.0)', value : '22'},
    {label : '/21 (255.255.248.0)', value : '21'},
    {label : '/20 (255.255.240.0)', value : '20'},
    {label : '/19 (255.255.224.0)', value : '19'},
    {label : '/18 (255.255.192.0)', value : '18'},
    {label : '/17 (255.255.128.0)', value : '17'},
    {label : '/16 (255.255.0.0)', value : '16'},
    {label : '/15 (255.254.0.0)', value : '15'},
    {label : '/14 (255.252.0.0)', value : '14'},
    {label : '/13 (255.248.0.0)', value : '13'},
    {label : '/12 (255.240.0.0)', value : '12'},
    {label : '/11 (255.224.0.0)', value : '11'},
    {label : '/10 (255.192.0.0)', value : '10'},
    {label : '/9 (255.128.0.0)', value : '9'},
    {label : '/8 (255.0.0.0)', value : '8'},
    {label : '/7 (254.0.0.0)', value : '7'},
    {label : '/6 (252.0.0.0)', value : '6'},
    {label : '/5 (248.0.0.0)', value : '5'},
    {label : '/4 (240.0.0.0)', value : '4'},
    {label : '/3 (224.0.0.0)', value : '3'},
    {label : '/2 (192.0.0.0)', value : '2'},
    {label : '/1 (128.0.0.0)', value : '1'},
  ];

  protected ipv6_prefix_options: any[] = [
    {label : '', value : ''},        {label : '/0', value : '0'},
    {label : '/4', value : '4'},     {label : '/8', value : '8'},
    {label : '/12', value : '12'},   {label : '/16', value : '16'},
    {label : '/20', value : '20'},   {label : '/24', value : '24'},
    {label : '/28', value : '28'},   {label : '/32', value : '32'},
    {label : '/36', value : '36'},   {label : '/40', value : '40'},
    {label : '/44', value : '44'},   {label : '/48', value : '48'},
    {label : '/52', value : '52'},   {label : '/56', value : '56'},
    {label : '/60', value : '60'},   {label : '/64', value : '64'},
    {label : '/68', value : '68'},   {label : '/72', value : '72'},
    {label : '/76', value : '76'},   {label : '/80', value : '80'},
    {label : '/84', value : '84'},   {label : '/88', value : '88'},
    {label : '/92', value : '92'},   {label : '/96', value : '96'},
    {label : '/100', value : '100'}, {label : '/104', value : '104'},
    {label : '/108', value : '108'}, {label : '/112', value : '112'},
    {label : '/116', value : '116'}, {label : '/120', value : '120'},
    {label : '/124', value : '124'}, {label : '/128', value : '128'},
  ];

  protected jailsResource: string = 'jail.query';
  protected jailsConfig: string = 'jails/configuration';
  protected jailsTemplate: string = 'jails/templates';

  constructor(protected rest: RestService, protected ws: WebSocketService) {};

  getIpv4Netmask() { return this.ipv4_netmask_options; }

  getIpv6Prefix() { return this.ipv6_prefix_options; }

  listJails() { return this.ws.call(this.jailsResource, {}); }

  getJailsConfig() { return this.rest.get(this.jailsConfig, {}); }

  listTemplates() { return this.rest.get(this.jailsTemplate, {}); }

  getLocalReleaseChoices() {
    return this.ws.call('jail.list_resource', ["RELEASE"]);
  };

  getRemoteReleaseChoices() {
    return this.ws.call('jail.list_resource', ["RELEASE", true]);
  };

  getBranches() {
    return this.ws.call('jail.list_resource', ["BRANCHES"]);
  }
}
