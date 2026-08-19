import { getAlertSummary, hasAlertDetails, stripAlertMarkup } from 'app/modules/alerts/utils/alert-summary.utils';

describe('alert summary utils', () => {
  const poolUpgradeAlert = "New ZFS version or feature flags are available for pool 'newpool'. Upgrading pools is a "
    + 'one-time process that can prevent rolling the system back to an earlier TrueNAS version. It is recommended '
    + 'you read the TrueNAS release notes and confirm you need the new feature(s) before upgrading the pool.';

  describe('getAlertSummary', () => {
    it('keeps only the first sentence of a multi-sentence message', () => {
      expect(getAlertSummary(poolUpgradeAlert))
        .toBe("New ZFS version or feature flags are available for pool 'newpool'.");
    });

    it('returns a short message unchanged', () => {
      expect(getAlertSummary('CPU is on fire')).toBe('CPU is on fire');
    });

    it('does not cut a sentence on a version number', () => {
      expect(getAlertSummary('An update to TrueNAS 25.04.1 is available for this system'))
        .toBe('An update to TrueNAS 25.04.1 is available for this system');
    });

    it('merges a very short leading sentence with the next one', () => {
      expect(getAlertSummary('Disk failed. Replace the disk as soon as possible.'))
        .toBe('Disk failed. Replace the disk as soon as possible.');
    });

    it('truncates at a word boundary when the first sentence is still too long', () => {
      const longSentence = `${'word '.repeat(40)}end.`;

      const summary = getAlertSummary(longSentence);

      expect(summary).toHaveLength(120);
      expect(summary.endsWith('…')).toBe(true);
      expect(summary).not.toContain('wor…');
    });

    it('drops markup so a truncated summary cannot cut a tag in half', () => {
      expect(getAlertSummary('<b>Pool</b> is degraded')).toBe('Pool is degraded');
    });

    it('returns an empty string for an empty message', () => {
      expect(getAlertSummary('')).toBe('');
    });
  });

  describe('hasAlertDetails', () => {
    it('is true when the summary leaves part of the message out', () => {
      expect(hasAlertDetails(poolUpgradeAlert)).toBe(true);
    });

    it('is false when the summary is the whole message', () => {
      expect(hasAlertDetails('CPU is on fire')).toBe(false);
    });
  });

  describe('stripAlertMarkup', () => {
    it('removes tags and collapses whitespace', () => {
      expect(stripAlertMarkup('<p>Pool  is</p>\n<b>degraded</b>')).toBe('Pool is degraded');
    });
  });
});
