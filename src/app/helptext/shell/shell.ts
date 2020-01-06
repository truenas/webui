import { T } from "app/translate-marker";

export default {
  usage_tooltip: T(
    '<b>Ctrl+C</b> kills a foreground process.<br>\
    Many utilities are built-in:<br> <b>Iperf</b>,\
    <b>Netperf</b>, <b>IOzone</b>, <b>arcsat</b>,\
    <b>tw_cli</b>, <br><b>MegaCli</b>,\
    <b>freenas-debug</b>, <b>tmux</b>,\
    <b>Dmidecode</b>.<br> Refer to the <a\
    href="--docurl--/cli.html"\
    target="_blank">Command Line Utilities</a>\
    chapter in the guide for usage information\
    and examples.'
  ),

  dialog_title: T('Copy and Paste'),

  copy_paste_message: T(
    "Context menu copy and paste operations \
    are disabled in the Shell. Copy and paste \
    shortcuts for Mac are <i>Command+c</i> and \
    <i>Command+v</i>. For most operating \
    systems, use <i>Ctrl+Insert</i> to copy and \
    <i>Shift+Insert</i> to paste."
  ),

  action_dismiss: T("Dismiss")
};
