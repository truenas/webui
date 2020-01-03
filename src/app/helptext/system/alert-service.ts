import { T } from '../../translate-marker';

export default {
    name_placeholder: T('Name'),
    name_tooltip: T('Name of the new alert service.'),

    enabled_placeholder: T('Enabled'),
    enabled_tooltip: T('Unset to disable this service without deleting it.'),

    type_placeholder: T('Type'),
    type_tooltip: T('Choose an alert service to display options for that\
 service.'),

    level_placeholder: T('Level'),
    level_tooltip: T('Select the level of severity.'),

    AWSSNS_region_placeholder: T('AWS Region'),
    AWSSNS_region_tooltip: T('Enter the <a\
 href="https://docs.aws.amazon.com/sns/latest/dg/sms_supported-countries.html"\
 target="_blank">AWS account region</a>.'),

    AWSSNS_topic_arn_placeholder: T('ARN'),
    AWSSNS_topic_arn_tooltip: T('Topic <a\
 href="https://docs.aws.amazon.com/sns/latest/dg/CreateTopic.html"\
 target="_blank">Amazon Resource Name (ARN)</a> for\
 publishing. Example: <b>arn:aws:sns:us-west-2:111122223333:MyTopic</b>.'),

    AWSSNS_aws_access_key_id_placeholder: T('Key ID'),
    AWSSNS_aws_access_key_id_tooltip: T('Access Key ID for the linked AWS account.'),

    AWSSNS_aws_secret_access_key_placeholder: T('Secret Key'),
    AWSSNS_aws_secret_access_key_tooltip: T('Secret Access Key for the linked AWS account.'),

    Mail_email_placeholder: T('Email Address'),
    Mail_email_tooltip: T('Enter a valid email address to receive alerts from this system.'),


    HipChat_hfrom_placeholder: T('From'),
    HipChat_hfrom_tooltip: T('Enter a name to send alerts'),

    HipChat_cluster_name_placeholder: T('Cluster Name'),
    HipChat_cluster_name_tooltip: T('HipChat cluster name.'),

    HipChat_base_url_placeholder: T('URL'),
    HipChat_base_url_tooltip: T('HipChat base URL.'),

    HipChat_room_id_placeholder: T('Room'),
    HipChat_room_id_tooltip: T('Name of the room.'),

    HipChat_auth_token_placeholder: T('Auth Token'),
    HipChat_auth_token_tooltip: T('Enter or paste an Authentication token.'),

    InfluxDB_host_placeholder: T('Host'),
    InfluxDB_host_tooltip: T('Enter the <a\
 href="https://docs.influxdata.com/influxdb/"\
 target="_blank">InfluxDB</a> hostname.'),

    InfluxDB_username_placeholder: T('Username'),
    InfluxDB_username_tooltip: T('Username for this service.'),

    InfluxDB_password_placeholder: T('Password'),
    InfluxDB_password_tooltip: T('Enter password.'),

    InfluxDB_database_placeholder: T('Database'),
    InfluxDB_database_tooltip: T('Name of the InfluxDB database.'),

    InfluxDB_series_name_placeholder: T('Series'),
    InfluxDB_series_name_tooltip: T('InfluxDB time series name for collected points.'),

    Mattermost_url_placeholder: T('Webhook URL'),
    Mattermost_url_tooltip: T('Enter or paste the <a\
 href="https://docs.mattermost.com/developer/webhooks-incoming.html"\
 target="_blank">incoming webhook</a> URL associated with\
 this service.'),

    Mattermost_username_placeholder: T('Username'),
    Mattermost_username_tooltip: T('Mattermost username.'),

    Mattermost_channel_placeholder: T('Channel'),
    Mattermost_channel_tooltip: T('Name of the <a\
 href="https://docs.mattermost.com/help/getting-started/organizing-conversations.html#managing-channels"\
 target="_blank">channel</a> to receive notifications.\
 This overrides the default channel in the incoming\
 webhook settings.'),

    Mattermost_icon_url_placeholder: T('Icon URL'),
    Mattermost_icon_url_tooltip: T('Icon file to use as the profile \
 picture for new messages. Example: \
 <i>https://mattermost.org/wp-content/uploads/2016/04/icon.png</i>.<br> \
 Requires configuring Mattermost to <a \
 href="https://docs.mattermost.com/administration/config-settings.html#enable-integrations-to-override-profile-picture-icons" target="_blank">override profile picture icons</a>.'),

    OpsGenie_api_key_placeholder: T('API Key'),
    OpsGenie_api_key_tooltip: T('Enter or paste the <a\
 href="https://docs.opsgenie.com/v1.0/docs/api-integration"\
 target="_blank">API key</a>. Find the API key by signing\
 into the OpsGenie web interface and going to\
 Integrations/Configured Integrations. Click the desired\
 integration, Settings, and read the API Key field.'),

    OpsGenie_api_url_placeholder: T('API URL'),
    OpsGenie_api_url_tooltip: T('Leave empty for default (<a href="https://api.opsgenie.com" target="_blank">OpsGenie API</a>)'),

    PagerDuty_service_key_placeholder: T('Service Key'),
    PagerDuty_service_key_tooltip: T('Enter or paste the "integration/service" key for this\
 system to access the <a\
 href="https://v2.developer.pagerduty.com/v2/docs/events-api"\
 target="_blank">PagerDuty API</a>.'),

    PagerDuty_client_name_placeholder: T('Client Name'),
    PagerDuty_client_name_tooltip: T('PagerDuty client name.'),

    Slack_url_placeholder: T('Webhook URL'),
    Slack_url_tooltip: T('Paste the <a\
 href="https://api.slack.com/incoming-webhooks"\
 target="_blank">incoming webhook</a> URL associated with\
 this service.'),

    SNMPTrap_host_placeholder: T('Hostname'),
    SNMPTrap_host_tooltip: T('Hostname or IP address of the system to \
 receive SNMP trap notifications.'),

    SNMPTrap_port_placeholder: T('Port'),
    SNMPTrap_port_tooltip: T('UDP port number on the system receiving \
 SNMP trap notifications. The default is <i>162</i>.'),

    SNMPTrap_v3_placeholder: T('SNMPv3 Security Model'),
    SNMPTrap_v3_tooltip: T('Enable the SNMPv3 security model.'),

    SNMPTrap_v3_username_placeholder: T('Username'),
    SNMPTrap_v3_username_tooltip: T('Username of the SNMP \
 <a href="http://snmplabs.com/pysnmp/docs/api-reference.html#pysnmp.hlapi.UsmUserData" \
 target="_blank">User-based Security Model (USM)</a> user.'),

    SNMPTrap_v3_authkey_placeholder: T('Secret Authentication Key'),
    SNMPTrap_v3_authkey_tooltip: T('Initial secret authentication key. \
 When an authentication key is not set, no <i>Authentication Protocol</i> is \
 used. If an authentication key is set and an \
 <i>Authentication Protocol</i> is not specified, \
 <a href="https://en.wikipedia.org/wiki/MD5" \
 target="_blank">MD5</a> is used as the default.<br> \
 Must be at least 8 and at most 32 octets long.'),

    SNMPTrap_v3_privkey_placeholder: T('Secret Encryption Key'),
    SNMPTrap_v3_privkey_tooltip: T('Initial secret encryption key. \
 If an encryption key is not set, no <i>Encryption Protocol</i> is used. \
 If an encryption key is set and an <i>Encryption Protocol</i> is \
 not specified, \
 <a href="https://en.wikipedia.org/wiki/Data_Encryption_Standard" \
 target="_blank">DES</a> is used as the default.<br> \
 Must be at least 8 and at most 32 octets long.'),

    SNMPTrap_v3_authprotocol_placeholder: T('Authentication Protocol'),
    SNMPTrap_v3_authprotocol_tooltip: T('<a href="https://en.wikipedia.org/wiki/Authentication_protocol" \
 target="_blank">Authentication protocol</a> used to authenticate \
 messages sent on behalf of the specified <i>Username</i>.'),

    SNMPTrap_v3_privprotocol_placeholder: T('Encryption Protocol'),
    SNMPTrap_v3_privprotocol_tooltip: T('<a href="https://en.wikipedia.org/wiki/Cryptographic_protocol" \
 target="_blank">Encryption protocol</a> used to encrypt messages \
 sent on behalf of the specified <i>Username</i>.'),

    SNMPTrap_community_placeholder: T('SNMP Community'),
    SNMPTrap_community_tooltip: T('Network community string. \
 The community string acts like a user ID or password. A user with \
 the correct community string has access to network information. The \
 default is <i>public</i>. For more information, see \
 <a href="https://community.helpsystems.com/knowledge-base/intermapper/snmp/snmp-community-strings/" \
 target="_blank">What is an SNMP Community String?</a>.'),

    VictorOps_api_key_placeholder: T('API Key'),
    VictorOps_api_key_tooltip: T('Enter or paste the <a\
 href="https://help.victorops.com/knowledge-base/api/"\
 target="_blank">VictorOps API key</a>.'),

    VictorOps_routing_key_placeholder: T('Routing Key'),
    VictorOps_routing_key_tooltip: T('Enter or paste the <a\
 href="https://portal.victorops.com/public/api-docs.html#/Routing32Keys"\
 target="_blank">VictorOps routing key</a>.'),

}
