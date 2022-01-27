import { Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';

export default {
  location_placeholder: T('Location'),
  location_tooltip: T('Enter the location of the system.'),
  location_label: 'Location',
  location_validation: [],

  contact_placeholder: T('Contact'),
  contact_tooltip: T('E-mail address that will receive SNMP service messages.'),
  contact_validation: [Validators.email],

  community_placeholder: T('Community'),
  community_tooltip: T('Change from <i>public</i> to increase system security.\
 Can only contain alphanumeric characters, underscores,\
 dashes, periods, and spaces. This can be left empty\
 for <i>SNMPv3</i> networks.'),
  community_validation: [Validators.pattern(/^[\w\_\-\.\s]*$/)],

  v3_placeholder: T('SNMP v3 Support'),
  v3_tooltip: T('Set to to enable support for <a\
 href="https://tools.ietf.org/html/rfc3410"\
 target="_blank">SNMP version 3</a>. See <a\
 href="http://net-snmp.sourceforge.net/docs/man/snmpd.conf.html"\
 target="_blank">snmpd.conf(5)</a> for configuration\
 details.'),

  v3_username_placeholder: T('Username'),
  v3_username_tooltip: T('Enter a username to register with this service.'),
  v3_username_relation: [{
    action: RelationAction.Hide,
    when: [{ name: 'v3', value: false }],
  }],

  v3_authtype_placeholder: T('Authentication Type'),
  v3_authtype_tooltip: T('Choose an authentication method.'),
  v3_authtype_options: [
    { label: '---', value: '' }, { label: 'MD5', value: 'MD5' },
    { label: 'SHA', value: 'SHA' },
  ],
  v3_authtype_relation: [{
    action: RelationAction.Hide,
    when: [{ name: 'v3', value: false }],
  }],

  v3_password_placeholder: T('Password'),
  v3_password_tooltip: T('Enter a password of at least eight characters.'),
  v3_password_validation: [Validators.minLength(8), Validators.required],
  v3_password_relation: [{
    action: RelationAction.Hide,
    when: [{ name: 'v3', value: false }],
  }],

  v3_password2_placeholder: T('Confirm Password'),
  v3_password2_validation: [],
  v3_password2_relation: [{
    action: RelationAction.Hide,
    when: [{ name: 'v3', value: false }],
  }],

  v3_privproto_placeholder: T('Privacy Protocol'),
  v3_privproto_tooltip: T('Choose a privacy protocol.'),
  v3_privproto_options: [
    { label: '---', value: null },
    { label: 'AES', value: 'AES' },
    { label: 'DES', value: 'DES' },
  ],
  v3_privproto_relation: [{
    action: RelationAction.Hide,
    when: [{ name: 'v3', value: false }],
  }],

  v3_privpassphrase_placeholder: T('Privacy Passphrase'),
  v3_privpassphrase_tooltip: T('Enter a separate privacy passphrase. <b>Password</b>\
 is used when this is left empty.'),
  v3_privpassphrase_validation: [Validators.minLength(8)],
  v3_privpassphrase_relation: [{
    action: RelationAction.Hide,
    when: [{ name: 'v3', value: false }],
  }],

  v3_privpassphrase2_placeholder: T('Confirm Privacy Passphrase'),
  v3_privpassphrase2_relation: [{
    action: RelationAction.Hide,
    when: [{ name: 'v3', value: false }],
  }],

  options_placeholder: T('Auxiliary Parameters'),
  options_tooltip: T('Enter any additional <a\
 href="http://net-snmp.sourceforge.net/docs/man/snmpd.conf.html"\
 target="_blank">snmpd.conf(5)</a> options. Add one\
 option for each line.'),

  zilstat_placeholder: T('Expose zilstat via SNMP'),
  zilstat_tooltip: T('Enabling this option may have performance implications on your pools.'),

  loglevel_placeholder: T('Log Level'),
  loglevel_tooltip: T('Choose how many log entries to create. Choices range\
 from the least log entries (<i>Emergency</i>) to the\
 most (<i>Debug</i>).'),
  loglevel_options: [
    { label: 'Emergency', value: 0 },
    { label: 'Alert', value: 1 },
    { label: 'Critical', value: 2 },
    { label: 'Error', value: 3 },
    { label: 'Warning', value: 4 },
    { label: 'Notice', value: 5 },
    { label: 'Info', value: 6 },
    { label: 'Debug', value: 7 },
  ],
  general_title: T('General Options'),
  v3_title: T('SNMP v3 Options'),
  other_title: T('Other Options'),

  formTitle: T('SNMP'),
};
