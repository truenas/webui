import { Component, OnInit } from '@angular/core';
import { T } from '../../../translate-marker';

@Component({
  selector: 'app-certificates-dash',
  templateUrl: './certificates-dash.component.html'
})
export class CertificatesDashComponent implements OnInit {
  cards: any;

  constructor() { }

  ngOnInit(): void {
    this.getCards();
  }

  getCards() {
    this.cards = [
      {
        name: 'certificates',
        tableConf: {
          title: T('Certificates'),
          queryCall: 'certificate.query',
          deleteCall: 'certificate.delete',
          columns: [
            { name: T('Name'), prop: 'name'},
            { name: T('Issuer'), prop: 'issuer' },
            { name: T('DN'), prop: 'dn' },
          ],
          parent: this,
          add: function() {
            // this.parent.modalService.open('slide-in-form', this.parent.staticRouteFormComponent);
          },
          edit: function(row) {
            // this.parent.modalService.open('slide-in-form', this.parent.staticRouteFormComponent, row.id);
          },
          deleteMsg: {
            // title: 'static route',
            // key_props: ['destination', 'gateway'],
          }
        }
      },
      {
        name: 'CSRs',
        tableConf: {
          title: T('Certificate Signing Requests'),
          queryCall: 'certificate.query',
          deleteCall: 'certificate.delete',
          columns: [
            { name: T('Name'), prop: 'name'},
            { name: T('Internal'), prop: 'internal'},
            { name: T('Issuer'), prop: 'issuer' },
            { name: T('DN'), prop: 'dn' },
            { name: T('From'), prop: 'from' },
            { name: T('Until'), prop: 'until' },
          ],
          parent: this,
          add: function() {
            // this.parent.modalService.open('slide-in-form', this.parent.staticRouteFormComponent);
          },
          edit: function(row) {
            // this.parent.modalService.open('slide-in-form', this.parent.staticRouteFormComponent, row.id);
          },
          deleteMsg: {
            // title: 'static route',
            // key_props: ['destination', 'gateway'],
          }
        }
      },
      {
        name: 'certificate-authorities',
        tableConf: {
          title: T('Certificate Authorities'),
          queryCall: 'certificateauthority.query',
          deleteCall: 'certificateauthority.delete',
          columns: [
            { name: T('Name'), prop: 'name'},
            { name: T('Internal'), prop: 'internal'},
            { name: T('Issuer'), prop: 'issuer' },
            { name: T('DN'), prop: 'dn' },
            { name: T('From'), prop: 'from' },
            { name: T('Until'), prop: 'until' },
          ],
          parent: this,
          add: function() {
            // this.parent.modalService.open('slide-in-form', this.parent.staticRouteFormComponent);
          },
          edit: function(row) {
            // this.parent.modalService.open('slide-in-form', this.parent.staticRouteFormComponent, row.id);
          },
          deleteMsg: {
            // title: 'static route',
            // key_props: ['destination', 'gateway'],
          }
        }
      },
      {
        name: 'acme-dns',
        tableConf: {
          title: T('ACME DNS Authenticators'),
          queryCall: 'acme.dns.authenticator.query',
          deleteCall: 'acme.dns.authenticator.delete',
          columns: [
            { name: T('Name'), prop: 'name'},
            { name: T('Authenticator'), prop: 'authenticator'}
          ],
          parent: this,
          add: function() {
            // this.parent.modalService.open('slide-in-form', this.parent.staticRouteFormComponent);
          },
          edit: function(row) {
            // this.parent.modalService.open('slide-in-form', this.parent.staticRouteFormComponent, row.id);
          },
          deleteMsg: {
            // title: 'static route',
            // key_props: ['destination', 'gateway'],
          }
        }
      }
      
    ]
  }


}
