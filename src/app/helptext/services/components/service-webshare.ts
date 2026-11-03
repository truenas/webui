import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextServiceWebshare = {
  search_enabled_tooltip: T('Enable TrueSearch file indexing and search functionality. When enabled, the active WebShares will be indexed for fast file searching.'),
  passkey_tooltip: T('Configure passkey authentication for WebShare. Required means users must use passkeys. Enabled allows passkeys as an option. Disabled turns off passkey authentication.'),
  mcp_enabled_tooltip: T('Enable the Webshare Model Context Protocol (MCP) server, which lets users connect an AI assistant to their Webshare files.'),
  mcp_allowed_groups_tooltip: T('Groups whose members may connect an AI assistant to Webshare. Only groups that also grant Webshare access can be selected.'),
  mcp_allow_write_tooltip: T('Allow the AI assistant to create new files and folders. It can never overwrite, delete, or rename existing files. When unset, access is read-only.'),
};
