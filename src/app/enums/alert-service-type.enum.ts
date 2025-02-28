export enum AlertServiceType {
  AwsSns = 'AWSSNS',
  Mail = 'Mail',
  InfluxDb = 'InfluxDB',
  Mattermost = 'Mattermost',
  OpsGenie = 'OpsGenie',
  PagerDuty = 'PagerDuty',
  Slack = 'Slack',
  SnmpTrap = 'SNMPTrap',
  Telegram = 'Telegram',
  SplunkOnCall = 'VictorOps',
}

export const alertServiceNames = [
  {
    label: 'AWS SNS',
    value: AlertServiceType.AwsSns,
  }, {
    label: 'E-Mail',
    value: AlertServiceType.Mail,
  }, {
    label: 'InfluxDB',
    value: AlertServiceType.InfluxDb,
  }, {
    label: 'Mattermost',
    value: AlertServiceType.Mattermost,
  }, {
    label: 'OpsGenie',
    value: AlertServiceType.OpsGenie,
  }, {
    label: 'PagerDuty',
    value: AlertServiceType.PagerDuty,
  }, {
    label: 'Slack',
    value: AlertServiceType.Slack,
  }, {
    label: 'SNMP Trap',
    value: AlertServiceType.SnmpTrap,
  }, {
    label: 'Telegram',
    value: AlertServiceType.Telegram,
  }, {
    label: 'Splunk On-Call',
    value: AlertServiceType.SplunkOnCall,
  },
];
