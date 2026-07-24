import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { exploreNasEnterpriseLink } from 'app/constants/explore-nas-enterprise-link.constant';
import { truenasConnectLink } from 'app/constants/truenas-connect-link.constant';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { TruenasConnectTier } from 'app/enums/truenas-connect-tier.enum';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';

export interface MarketingMessage {
  /** Untranslated tagline shown as the highlighted primary line. */
  text: string;
  /** Untranslated call-to-action shown below the tagline. Empty when the message is informational only. */
  cta: string;
  /** External link the message points to, or `null` for a non-clickable message. */
  href: string | null;
}

const exploreEnterpriseCta = T('Explore TrueNAS Enterprise');

/**
 * Enterprise awareness. Shown in every Community Edition rotation regardless of TrueNAS Connect state.
 */
export const enterpriseMarketingMessages: MarketingMessage[] = [
  T('More Performance, More Protection'),
  T('Boost Performance & Support'),
  T('Unlock High Performance Solutions'),
  T('Expert Support When You Need It'),
  T('Achieve 99.999% Uptime with HA'),
  T('Same trusted platform. Enterprise SLAs.'),
  T('Validated Hardware. 24x7 Support.'),
  T('From Evaluation to Enterprise, in one conversation.'),
  T('Community Friendly. Enterprise Ready.'),
  T('Trusted Software on Tested Hardware.'),
].map((text) => ({ text, cta: exploreEnterpriseCta, href: exploreNasEnterpriseLink }));

const tryTncCta = T('Try out TrueNAS Connect');

/**
 * Promote TrueNAS Connect. Shown when the system is not connected to TrueNAS Connect.
 */
export const promoteTncMarketingMessages: MarketingMessage[] = [
  T('Centralized Visibility. Simplified Management.'),
  T('Multiple Systems. Secure Browser Access. One URL.'),
  T('Try out WebShare and Spotlight Support.'),
  T('Get email alerts and reports. Free forever.'),
].map((text) => ({ text, cta: tryTncCta, href: truenasConnectLink }));

const upgradeTncCta = T('Upgrade to TrueNAS Connect Plus');

/**
 * Encourage upgrades. Shown when connected on the free Foundation tier.
 */
export const upgradeTncMarketingMessages: MarketingMessage[] = [
  T('Create, Manage and Monitor Replication'),
  T('Enable Custom Enclosure Support for Drive Monitoring'),
  T('Get 30-day Extended Stats Retention'),
  T('Inventory Control for Asset Management Across Systems'),
  T('Three Managed Systems. One Low Price.'),
].map((text) => ({ text, cta: upgradeTncCta, href: truenasConnectLink }));

/**
 * Thank-you. Shown when connected on a paid tier (Plus or Business). Non-clickable.
 */
export const thankYouMarketingMessage: MarketingMessage = {
  text: T('Thanks for supporting TrueNAS!'),
  cta: '',
  href: null,
};

/**
 * Enterprise awareness stays in rotation for every Community Edition system, joined by the
 * TrueNAS Connect messages that match the system's current connection state.
 */
export function getMarketingMessages(config: TruenasConnectConfig | undefined): MarketingMessage[] {
  const isConnected = config?.status === TruenasConnectStatus.Configured;
  const tier = config?.tier;

  if (isConnected && (tier === TruenasConnectTier.Plus || tier === TruenasConnectTier.Business)) {
    return [...enterpriseMarketingMessages, thankYouMarketingMessage];
  }

  if (isConnected && tier === TruenasConnectTier.Foundation) {
    return [...enterpriseMarketingMessages, ...upgradeTncMarketingMessages];
  }

  return [...enterpriseMarketingMessages, ...promoteTncMarketingMessages];
}
