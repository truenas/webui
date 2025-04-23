import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextAlertService = {
  enabledTooltip: T('Unset to disable this service without deleting it.'),

  typeTooltip: T('Choose an alert service to display options for that\
 service.'),

  levelTooltip: T('Select the level of severity. Alert notifications send for all warnings matching\
 and above the selected level. For example, a warning level set to Critical triggers notifications\
 for Critical, Alert, and Emergency level warnings.'),

  awsSns: {
    regionTooltip: T('Enter the <a\
 href="https://docs.aws.amazon.com/sns/latest/dg/sms_supported-countries.html"\
 target="_blank">AWS account region</a>.'),
    topicArnTooltip: T('Topic <a\
 href="https://docs.aws.amazon.com/sns/latest/dg/CreateTopic.html"\
 target="_blank">Amazon Resource Name (ARN)</a> for\
 publishing. Example: <b>arn:aws:sns:us-west-2:111122223333:MyTopic</b>.'),
    accessKeyIdTooltip: T('Access Key ID for the linked AWS account.'),
    secretAccessKeyTooltip: T('Secret Access Key for the linked AWS account.'),
  },

  emailTooltip: T('Enter an email address to override the admin account’s default email. \
 If left blank, the admin account’s email address will be used'),

  influxDb: {
    hostTooltip: T('Enter the <a\
 href="https://docs.influxdata.com/influxdb/"\
 target="_blank">InfluxDB</a> hostname.'),
    seriesNameTooltip: T('InfluxDB time series name for collected points.'),
  },

  mattermost: {
    urlTooltip: T('Enter or paste the <a\
 href="https://docs.mattermost.com/configure/integrations-configuration-settings.html#integrate-enableincomingwebhooks"\
 target="_blank">incoming webhook</a> URL associated with\
 this service.'),
    channelTooltip: T('Name of the <a\
 href="https://docs.mattermost.com/help/getting-started/organizing-conversations.html#managing-channels"\
 target="_blank">channel</a> to receive notifications.\
 This overrides the default channel in the incoming\
 webhook settings.'),
    iconUrlTooltip: T('Icon file to use as the profile \
 picture for new messages. Example: \
 <i>https://mattermost.org/wp-content/uploads/2016/04/icon.png</i>.<br> \
 Requires configuring Mattermost to <a \
 href="https://docs.mattermost.com/administration/config-settings.html#enable-integrations-to-override-profile-picture-icons" target="_blank">override profile picture icons</a>.'),
  },

  opsGenie: {
    apiKeyTooltip: T('Enter or paste the <a\
   href="https://docs.opsgenie.com/v1.0/docs/api-integration"\
   target="_blank">API key</a>. Find the API key by signing\
   into the OpsGenie web interface and going to\
   Integrations/Configured Integrations. Click the desired\
   integration, Settings, and read the API Key field.'),

    apiUrlTooltip: T('Leave empty for default (<a href="https://docs.opsgenie.com/docs/api-overview" target="_blank">OpsGenie API</a>)'),
  },

  pagerDuty: {
    serviceKeyTooltip: T('Enter or paste the "integration/service" key for this\
 system to access the <a\
 href="https://v2.developer.pagerduty.com/v2/docs/events-api"\
 target="_blank">PagerDuty API</a>.'),
    clientNameTooltip: T('PagerDuty client name.'),
  },

  slack: {
    urlTooltip: T('Paste the <a\
 href="https://api.slack.com/incoming-webhooks"\
 target="_blank">incoming webhook</a> URL associated with\
 this service.'),
  },

  snmpTrap: {
    hostTooltip: T('Hostname or IP address of the system to \
 receive SNMP trap notifications.'),
    portTooltip: T('UDP port number on the system receiving \
 SNMP trap notifications. The default is <i>162</i>.'),
    usernameTooltip: T('Username of the SNMP \
 <a href="https://pysnmp.readthedocs.io/en/latest/docs/pysnmp-hlapi-tutorial.html" \
 target="_blank">User-based Security Model (USM)</a> user.'),
    authKeyTooltip: T('Initial secret authentication key. \
 When an authentication key is not set, no <i>Authentication Protocol</i> is \
 used. If an authentication key is set and an \
 <i>Authentication Protocol</i> is not specified, \
 <a href="https://en.wikipedia.org/wiki/MD5" \
 target="_blank">MD5</a> is used as the default.<br> \
 Must be at least 8 and at most 32 octets long.'),
    privateKeyTooltip: T('Initial secret encryption key. \
 If an encryption key is not set, no <i>Encryption Protocol</i> is used. \
 If an encryption key is set and an <i>Encryption Protocol</i> is \
 not specified, \
 <a href="https://en.wikipedia.org/wiki/Data_Encryption_Standard" \
 target="_blank">DES</a> is used as the default.<br> \
 Must be at least 8 and at most 32 octets long.'),
    authProtocolTooltip: T('<a href="https://en.wikipedia.org/wiki/Authentication_protocol" \
 target="_blank">Authentication protocol</a> used to authenticate \
 messages sent on behalf of the specified <i>Username</i>.'),
    encryptionProtocolTooltip: T('<a href="https://en.wikipedia.org/wiki/Cryptographic_protocol" \
 target="_blank">Encryption protocol</a> used to encrypt messages \
 sent on behalf of the specified <i>Username</i>.'),
    communityTooltip: T('Network community string. \
 The community string acts like a user ID or password. A user with \
 the correct community string has access to network information. The \
 default is <i>public</i>. For more information, see \
 <a href="https://community.helpsystems.com/knowledge-base/intermapper/snmp/snmp-community-strings/" \
 target="_blank">What is an SNMP Community String?</a>.'),
  },

  telegram: {
    botTokenTooltip: T('Telegram Bot API Token (<a href="https://core.telegram.org/bots#3-how-do-i-create-a-bot"\
   target="_blank">How to create a Telegram Bot</a>)'),
    chatIdsTooltip: T('Enter a list of chat IDs separated by space, comma or semicolon. \
   To find your chat ID send a message to the bot, group or channel and visit \
   <a href="https://api.telegram.org/bot(BOT_TOKEN)/getUpdates" \
   target="_blank">https://api.telegram.org/bot(BOT_TOKEN)/getUpdates</a>.'),
  },

  splunkOnCall: {
    apiKeyTooltip: T('Enter or paste the <a\
   href="https://help.victorops.com/knowledge-base/api/"\
   target="_blank">Splunk On-Call API key</a>.'),
    routingKeyTooltip: T('Enter or paste the <a\
   href="https://portal.victorops.com/public/api-docs.html#/Routing32Keys"\
   target="_blank">Splunk On-Call routing key</a>.'),
  },
};
