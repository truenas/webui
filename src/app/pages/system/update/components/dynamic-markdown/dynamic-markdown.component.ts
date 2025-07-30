import {
  Component, input, computed, ChangeDetectionStrategy,
} from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MarkdownModule } from 'ngx-markdown';

type MarkdownContext = Record<string, unknown>;

interface TabSection {
  label: string;
  content: string;
}

interface ProcessedContent {
  hasTabSections: boolean;
  sections: ContentSection[];
}

interface ContentSection {
  type: 'markdown' | 'tabs';
  content?: string;
  tabs?: TabSection[];
}

@Component({
  selector: 'ix-dynamic-markdown',
  templateUrl: './dynamic-markdown.component.html',
  styleUrls: ['./dynamic-markdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MarkdownModule, MatTabsModule],
})
export class DynamicMarkdownComponent {
  readonly content = input.required<string>();
  readonly context = input<MarkdownContext>({});

  readonly processedData = computed((): ProcessedContent => {
    const markdown = this.content();
    const ctx = this.context();

    if (!markdown) {
      return { hasTabSections: false, sections: [] };
    }

    // Process simple conditional blocks and variable substitutions first
    const processed = this.processTemplate(markdown, ctx);

    // Then extract sections (mix of markdown and tabs)
    return this.extractSections(processed);
  });

  private processTemplate(content: string, context: MarkdownContext): string {
    let processed = content;

    // Process simple @if blocks with property checks and negation
    // Examples: @if (newVersion) { ... } or @if (!isHaLicensed) { ... }
    processed = this.processIfBlocks(processed, context);

    // Process simple variable interpolations
    // Example: {{ newVersion.version }}
    processed = processed.replace(
      /\{\{\s*(\w+(?:\.\w+)*)\s*\}\}/g,
      (match, propertyPath: string) => {
        const value = this.getNestedProperty(context, propertyPath);
        return value != null ? String(value) : '';
      },
    );

    // Process highlight syntax and convert to warnings
    processed = this.processHighlightSyntax(processed);

    return processed;
  }

  private processIfBlocks(content: string, context: MarkdownContext): string {
    // Match @if blocks with proper brace balancing
    const ifBlockRegex = /@if\s*\(\s*(!?)(\w+(?:\.\w+)*)\s*\)\s*{/g;
    let result = content;
    let match;

    while ((match = ifBlockRegex.exec(content)) !== null) {
      const startIndex = match.index;
      const negation = match[1];
      const propertyPath = match[2];

      // Find the matching closing brace
      let braceCount = 1;
      let endIndex = match.index + match[0].length;

      while (braceCount > 0 && endIndex < content.length) {
        if (content[endIndex] === '{') {
          braceCount++;
        } else if (content[endIndex] === '}') {
          braceCount--;
        }
        endIndex++;
      }

      if (braceCount === 0) {
        const blockContent = content.substring(match.index + match[0].length, endIndex - 1);
        const value = this.getNestedProperty(context, propertyPath);
        const shouldShow = negation ? !value : !!value;

        const replacement = shouldShow ? blockContent : '';
        result = result.substring(0, startIndex) + replacement + result.substring(endIndex);

        // Reset regex to start from beginning after replacement
        ifBlockRegex.lastIndex = 0;
        content = result;
      }
    }

    return result;
  }

  private getNestedProperty(obj: MarkdownContext, path: string): unknown {
    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  private extractSections(content: string): ProcessedContent {
    const sections: ContentSection[] = [];
    const tabSectionRegex = /<!-- tabs -->([\s\S]*?)<!-- \/tabs -->/g;

    let lastIndex = 0;
    let match;
    let hasTabSections = false;

    while ((match = tabSectionRegex.exec(content)) !== null) {
      hasTabSections = true;

      // Add markdown content before the tab section
      if (match.index > lastIndex) {
        const markdownContent = content.substring(lastIndex, match.index).trim();
        if (markdownContent) {
          sections.push({
            type: 'markdown',
            content: markdownContent,
          });
        }
      }

      // Extract tabs from the tab section
      const tabs = this.extractTabs(match[1]);
      if (tabs.length > 0) {
        sections.push({
          type: 'tabs',
          tabs,
        });
      }

      lastIndex = match.index + match[0].length;
    }

    // Add any remaining markdown content after the last tab section
    if (lastIndex < content.length) {
      const remainingContent = content.substring(lastIndex).trim();
      if (remainingContent) {
        sections.push({
          type: 'markdown',
          content: remainingContent,
        });
      }
    }

    // If no sections were added, treat entire content as markdown
    if (sections.length === 0 && content.trim()) {
      sections.push({
        type: 'markdown',
        content,
      });
    }

    return { hasTabSections, sections };
  }

  private extractTabs(tabsContent: string): TabSection[] {
    const tabRegex = /<!-- tab: (.+?) -->([\s\S]*?)(?=<!-- tab:|<!-- \/tabs -->|$)/g;
    const tabs: TabSection[] = [];

    let tabMatch;
    while ((tabMatch = tabRegex.exec(tabsContent)) !== null) {
      tabs.push({
        label: tabMatch[1].trim(),
        content: tabMatch[2].trim(),
      });
    }

    return tabs;
  }

  private processHighlightSyntax(content: string): string {
    let processed = content;

    // Match ===text=== for warning highlights
    // Must have exactly 3 equals on each side
    processed = processed.replace(
      /(?<![=])===([^=]+?)===(?![=])/gu,
      '<span class="highlight-warning">$1</span>',
    );

    // Match ==text== for error highlights
    // Must have exactly 2 equals on each side
    processed = processed.replace(
      /(?<![=])==([^=]+?)==(?![=])/gu,
      '<span class="highlight-error">$1</span>',
    );

    return processed;
  }
}
