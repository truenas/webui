import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UpsMode, UpsShutdownMode } from 'app/enums/ups-mode.enum';

export const helptextServiceUps = {
  fieldsetGeneral: T('General Options'),
  fieldsetMonitor: T('Monitor'),
  fieldsetShutdown: T('Shutdown'),
  fieldsetOther: T('Other Options'),

  modeLabel: T('UPS Mode'),
  modeOptions: [
    { label: T('Master'), value: UpsMode.Master },
    { label: T('Slave'), value: UpsMode.Slave },
  ],

  identifierLabel: T('Identifier'),
  identifierTooltip: T('Describe the UPS device. It can contain alphanumeric,\
 period, comma, hyphen, and underscore characters.'),

  remotehostLabel: T('Remote Host'),
  remotehostTooltip: T('IP address of the remote system with <i>UPS Mode</i>\
 set as <i>Master</i>. Enter a valid IP address in\
 the format <i>192.168.0.1</i>.'),

  remoteportLabel: T('Remote Port'),
  remoteportTooltip: T(' When the <b>UPS Mode</b> is set to \
<i>slave</i>. Enter the open network port number of the UPS \
<i>Master</i> system. The default port is <i>3493</i>.'),

  driverLabel: T('Driver'),
  driverTooltip: T('See the <a\
 href="http://networkupstools.org/stable-hcl.html"\
 target="_blank">Network UPS Tools compatibility\
 list</a> for a list of supported UPS devices.'),

  portLabel: T('Port or Hostname'),
  portTooltip: T('Serial or USB port connected to the UPS. To \
 automatically detect and manage the USB port settings, select \
 <i>auto</i>.<br><br> When an SNMP driver is selected, enter the IP \
 address or hostname of the SNMP UPS device.'),

  optionsLabel: T('Auxiliary Parameters (ups.conf)'),
  optionsTooltip: T('Enter any extra options from <a\
 href="http://networkupstools.org/docs/man/ups.conf.html"\
 target="_blank">UPS.CONF(5)</a>.'),

  optionsupsdLabel: T('Auxiliary Parameters (upsd.conf)'),
  optionsupsdTooltip: T('Enter any extra options from <a\
 href="http://networkupstools.org/docs/man/upsd.conf.html"\
 target="_blank">UPSD.CONF(5)</a>.'),

  shutdownLabel: T('Shutdown Mode'),
  shutdownTooltip: T('Choose when the UPS initiates shutdown.'),
  shutdownOptions: [
    { label: T('UPS reaches low battery'), value: UpsShutdownMode.LowBattery },
    { label: T('UPS goes on battery'), value: UpsShutdownMode.Battery },
  ],

  shutdowntimerLabel: T('Shutdown Timer'),
  shutdowntimerTooltip: T('Enter a value in seconds for the the UPS to wait\
 before initiating shutdown. Shutdown will not occur\
 if power is restored while the timer is counting\
 down. This value only applies when <b>Shutdown\
 mode</b> is set to <i>UPS goes on battery</i>.'),

  shutdowncmdLabel: T('Shutdown Command'),
  shutdowncmdTooltip: T('When battery power is low or the shutdown timer ends,\
 enter the custom command to overrule the default shutdown command.'),

  nocommwarntimeLabel: T('No Communication Warning Time'),
  nocommwarntimeTooltip: T('Enter a number of seconds to wait before alerting that\
 the service cannot reach any UPS. Warnings continue\
 until the situation is fixed.'),

  monuserLabel: T('Monitor User'),
  monuserTooltip: T('Enter a user to associate with this service. Keeping\
 the default is recommended.'),

  monpwdLabel: T('Monitor Password'),
  monpwdTooltip: T('Change the default password to improve system\
 security. The new password cannot contain a\
 space or <b>#</b>.'),

  extrausersLabel: T('Extra Users'),
  extrausersTooltip: T('Enter accounts that have administrative access.\
 See <a\
 href="https://linux.die.net/man/5/upsd.users"\
 target="_blank">upsd.users(5)</a> for examples.'),

  rmonitorLabel: T('Remote Monitor'),
  rmonitorTooltip: T('Set for the default configuration to listen on all\
 interfaces using the known values of user:\
 <i>upsmon</i> and password: <i>fixmepass</i>.'),

  powerdownLabel: T('Power Off UPS'),
  powerdownTooltip: T('Set for the UPS to power off after shutting down the system.'),

  hostsyncLabel: T('Host Sync'),
  hostsyncTooltip: T('Upsmon will wait up to this many seconds in master mode for\
 the slaves to disconnect during a shutdown situation.'),
};
