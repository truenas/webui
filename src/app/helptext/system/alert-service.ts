import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextAlertService = {
  name_tooltip: T('Name of the new alert service.'),

  enabled_tooltip: T('Unset to disable this service without deleting it.'),

  type_tooltip: T('Choose an alert service to display options for that\
 service.'),

  level_tooltip: T('Select the level of severity. Alert notifications send for all warnings matching\
 and above the selected level. For example, a warning level set to Critical triggers notifications\
 for Critical, Alert, and Emergency level warnings.'),

  AWSSNS_region_tooltip: T('Enter the <a\
 href="https://docs.aws.amazon.com/sns/latest/dg/sms_supported-countries.html"\
 target="_blank">AWS account region</a>.'),

  AWSSNS_topic_arn_tooltip: T('Topic <a\
 href="https://docs.aws.amazon.com/sns/latest/dg/CreateTopic.html"\
 target="_blank">Amazon Resource Name (ARN)</a> for\
 publishing. Example: <b>arn:aws:sns:us-west-2:111122223333:MyTopic</b>.'),

  AWSSNS_aws_access_key_id_tooltip: T('Access Key ID for the linked AWS account.'),

  AWSSNS_aws_secret_access_key_tooltip: T('Secret Access Key for the linked AWS account.'),

  Mail_email_tooltip: T('Enter an email address to override the admin account’s default email. \
 If left blank, the admin account’s email address will be used'),

  InfluxDB_host_tooltip: T('Enter the <a\
 href="https://docs.influxdata.com/influxdb/"\
 target="_blank">InfluxDB</a> hostname.'),

  InfluxDB_username_tooltip: T('Username for this service.'),

  InfluxDB_password_tooltip: T('Enter password.'),

  InfluxDB_database_tooltip: T('Name of the InfluxDB database.'),

  InfluxDB_series_name_tooltip: T('InfluxDB time series name for collected points.'),

  Mattermost_url_tooltip: T('Enter or paste the <a\
 href="https://docs.mattermost.com/configure/integrations-configuration-settings.html#integrate-enableincomingwebhooks"\
 target="_blank">incoming webhook</a> URL associated with\
 this service.'),

  Mattermost_username_tooltip: T('Mattermost username.'),

  Mattermost_channel_tooltip: T('Name of the <a\
 href="https://docs.mattermost.com/help/getting-started/organizing-conversations.html#managing-channels"\
 target="_blank">channel</a> to receive notifications.\
 This overrides the default channel in the incoming\
 webhook settings.'),

  Mattermost_icon_url_tooltip: T('Icon file to use as the profile \
 picture for new messages. Example: \
 <i>https://mattermost.org/wp-content/uploads/2016/04/icon.png</i>.<br> \
 Requires configuring Mattermost to <a \
 href="https://docs.mattermost.com/administration/config-settings.html#enable-integrations-to-override-profile-picture-icons" target="_blank">override profile picture icons</a>.'),

  OpsGenie_api_key_tooltip: T('Enter or paste the <a\
 href="https://docs.opsgenie.com/v1.0/docs/api-integration"\
 target="_blank">API key</a>. Find the API key by signing\
 into the OpsGenie web interface and going to\
 Integrations/Configured Integrations. Click the desired\
 integration, Settings, and read the API Key field.'),

  OpsGenie_api_url_tooltip: T('Leave empty for default (<a href="https://docs.opsgenie.com/docs/api-overview" target="_blank">OpsGenie API</a>)'),

  PagerDuty_service_key_tooltip: T('Enter or paste the "integration/service" key for this\
 system to access the <a\
 href="https://v2.developer.pagerduty.com/v2/docs/events-api"\
 target="_blank">PagerDuty API</a>.'),

  PagerDuty_client_name_tooltip: T('PagerDuty client name.'),

  Slack_url_tooltip: T('Paste the <a\
 href="https://api.slack.com/incoming-webhooks"\
 target="_blank">incoming webhook</a> URL associated with\
 this service.'),

  SNMPTrap_host_tooltip: T('Hostname or IP address of the system to \
 receive SNMP trap notifications.'),

  SNMPTrap_port_tooltip: T('UDP port number on the system receiving \
 SNMP trap notifications. The default is <i>162</i>.'),

  SNMPTrap_v3_tooltip: T('Enable the SNMPv3 security model.'),

  SNMPTrap_v3_username_tooltip: T('Username of the SNMP \
 <a href="https://pysnmp.readthedocs.io/en/latest/docs/pysnmp-hlapi-tutorial.html" \
 target="_blank">User-based Security Model (USM)</a> user.'),

  SNMPTrap_v3_authkey_tooltip: T('Initial secret authentication key. \
 When an authentication key is not set, no <i>Authentication Protocol</i> is \
 used. If an authentication key is set and an \
 <i>Authentication Protocol</i> is not specified, \
 <a href="https://en.wikipedia.org/wiki/MD5" \
 target="_blank">MD5</a> is used as the default.<br> \
 Must be at least 8 and at most 32 octets long.'),

  SNMPTrap_v3_privkey_tooltip: T('Initial secret encryption key. \
 If an encryption key is not set, no <i>Encryption Protocol</i> is used. \
 If an encryption key is set and an <i>Encryption Protocol</i> is \
 not specified, \
 <a href="https://en.wikipedia.org/wiki/Data_Encryption_Standard" \
 target="_blank">DES</a> is used as the default.<br> \
 Must be at least 8 and at most 32 octets long.'),

  SNMPTrap_v3_authprotocol_tooltip: T('<a href="https://en.wikipedia.org/wiki/Authentication_protocol" \
 target="_blank">Authentication protocol</a> used to authenticate \
 messages sent on behalf of the specified <i>Username</i>.'),

  SNMPTrap_v3_privprotocol_tooltip: T('<a href="https://en.wikipedia.org/wiki/Cryptographic_protocol" \
 target="_blank">Encryption protocol</a> used to encrypt messages \
 sent on behalf of the specified <i>Username</i>.'),

  SNMPTrap_community_tooltip: T('Network community string. \
 The community string acts like a user ID or password. A user with \
 the correct community string has access to network information. The \
 default is <i>public</i>. For more information, see \
 <a href="https://community.helpsystems.com/knowledge-base/intermapper/snmp/snmp-community-strings/" \
 target="_blank">What is an SNMP Community String?</a>.'),

  Telegram_bot_token_tooltip: T('Telegram Bot API Token (<a href="https://core.telegram.org/bots#3-how-do-i-create-a-bot"\
 target="_blank">How to create a Telegram Bot</a>)'),

  Telegram_chat_ids_tooltip: T('Enter a list of chat IDs separated by space, comma or semicolon. \
 To find your chat ID send a message to the bot, group or channel and visit \
 <a href="https://api.telegram.org/bot(BOT_TOKEN)/getUpdates" \
 target="_blank">https://api.telegram.org/bot(BOT_TOKEN)/getUpdates</a>.'),

  SplunkOnCall_api_key_tooltip: T('Enter or paste the <a\
 href="https://help.victorops.com/knowledge-base/api/"\
 target="_blank">Splunk On-Call API key</a>.'),

  SplunkOnCall_routing_key_tooltip: T('Enter or paste the <a\
 href="https://portal.victorops.com/public/api-docs.html#/Routing32Keys"\
 target="_blank">Splunk On-Call routing key</a>.'),

};
