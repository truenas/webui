import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export default {
  usage_tooltip: T(
    '<b>Ctrl+C</b> kills a foreground process.<br>\
    Many utilities are built-in:<br> <b>Iperf</b>,\
    <b>Netperf</b>, <b>IOzone</b>, <b>arcstat</b>,\
    <b>tw_cli</b>, <br><b>MegaCli</b>,\
    <b>freenas-debug</b>, <b>tmux</b>,\
    <b>Dmidecode</b>.',
  ),

  dialog_title: T('Copy and Paste'),

  copy_paste_message: T(
    'Context menu copy and paste operations \
    are disabled in the Shell. Copy and paste \
    shortcuts for Mac are <i>Command+c</i> and \
    <i>Command+v</i>. For most operating \
    systems, use <i>Ctrl+Insert</i> to copy and \
    <i>Shift+Insert</i> to paste.',
  ),

  action_dismiss: T('Dismiss'),

  podConsole: {
    nopod: {
      title: T('No Pods Found'),
      message: T('Invalid Pod name'),
    },
    choosePod: {
      title: T('Choose pod'),
      placeholder: T('Pods'),
      action: T('Choose'),
    },
    chooseContainer: {
      title: T('Choose container'),
      placeholder: T('Containers'),
    },
    chooseCommand: {
      placeholder: T('Commands'),
    },
  },
};
