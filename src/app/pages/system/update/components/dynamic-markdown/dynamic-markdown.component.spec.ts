import { MatTabsModule } from '@angular/material/tabs';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MarkdownModule } from 'ngx-markdown';
import { DynamicMarkdownComponent } from './dynamic-markdown.component';

describe('DynamicMarkdownComponent', () => {
  let spectator: Spectator<DynamicMarkdownComponent>;
  const createComponent = createComponentFactory({
    component: DynamicMarkdownComponent,
    imports: [MarkdownModule.forRoot(), MatTabsModule],
  });

  it('should create', () => {
    spectator = createComponent({
      props: {
        content: 'Test content',
        context: {},
      },
    });

    expect(spectator.component).toBeTruthy();
  });

  it('should render plain markdown content', () => {
    spectator = createComponent({
      props: {
        content: '# Hello World\n\nThis is a test.',
        context: {},
      },
    });

    expect(spectator.query('markdown')).toBeTruthy();
  });

  it('should process @if blocks with truthy conditions', () => {
    spectator = createComponent({
      props: {
        content: '@if (isEnterprise) {Enterprise content}',
        context: { isEnterprise: true },
      },
    });

    // The component should process the template and render markdown with "Enterprise content"
    const component = spectator.component;
    const processedData = component.processedData();
    expect(processedData.sections[0].content).toContain('Enterprise content');
  });

  it('should not render @if blocks with falsy conditions', () => {
    spectator = createComponent({
      props: {
        content: '@if (isEnterprise) {Enterprise content}',
        context: { isEnterprise: false },
      },
    });

    const component = spectator.component;
    const processedData = component.processedData();
    // When @if condition is false and there's no other content, sections array will be empty
    expect(processedData.sections).toHaveLength(0);
  });

  it('should process negated @if blocks', () => {
    spectator = createComponent({
      props: {
        content: '@if (!isEnterprise) {Community content}',
        context: { isEnterprise: false },
      },
    });

    const component = spectator.component;
    const processedData = component.processedData();
    expect(processedData.sections[0].content).toContain('Community content');
  });

  it('should process variable interpolations', () => {
    spectator = createComponent({
      props: {
        content: 'Version: {{ version }}',
        context: { version: '24.10' },
      },
    });

    const component = spectator.component;
    const processedData = component.processedData();
    expect(processedData.sections[0].content).toBe('Version: 24.10');
  });

  it('should process nested property access', () => {
    spectator = createComponent({
      props: {
        content: 'Version: {{ newVersion.version }}',
        context: { newVersion: { version: '24.10' } },
      },
    });

    const component = spectator.component;
    const processedData = component.processedData();
    expect(processedData.sections[0].content).toBe('Version: 24.10');
  });

  it('should render tab sections', () => {
    spectator = createComponent({
      props: {
        content: `<!-- tabs -->
<!-- tab: Tab 1 -->
Content 1
<!-- tab: Tab 2 -->
Content 2
<!-- /tabs -->`,
        context: {},
      },
    });

    const tabGroup = spectator.query('mat-tab-group');
    expect(tabGroup).toBeTruthy();

    const component = spectator.component;
    const processedData = component.processedData();
    expect(processedData.hasTabSections).toBe(true);
    expect(processedData.sections[0].tabs).toHaveLength(2);
    expect(processedData.sections[0].tabs[0].label).toBe('Tab 1');
    expect(processedData.sections[0].tabs[1].label).toBe('Tab 2');
  });

  it('should handle mixed content with tabs', () => {
    spectator = createComponent({
      props: {
        content: `# Before tabs

<!-- tabs -->
<!-- tab: Tab 1 -->
Tab content
<!-- /tabs -->

# After tabs`,
        context: {},
      },
    });

    const markdownElements = spectator.queryAll('markdown');
    expect(markdownElements.length).toBeGreaterThan(1);
    expect(spectator.query('mat-tab-group')).toBeTruthy();

    const component = spectator.component;
    const processedData = component.processedData();
    expect(processedData.sections).toHaveLength(3); // before, tabs, after
    expect(processedData.sections[0].type).toBe('markdown');
    expect(processedData.sections[1].type).toBe('tabs');
    expect(processedData.sections[2].type).toBe('markdown');
  });

  it('should handle @if blocks inside tabs', () => {
    spectator = createComponent({
      props: {
        content: `<!-- tabs -->
<!-- tab: Enterprise -->
@if (isEnterprise) {Enterprise features}
<!-- tab: Community -->
@if (!isEnterprise) {Community features}
<!-- /tabs -->`,
        context: { isEnterprise: true },
      },
    });

    const component = spectator.component;
    const processedData = component.processedData();
    expect(processedData.sections[0].tabs[0].content).toContain('Enterprise features');
    expect(processedData.sections[0].tabs[1].content).toBe('');
  });

  it('should handle empty content', () => {
    spectator = createComponent({
      props: {
        content: '',
        context: {},
      },
    });

    expect(spectator.component).toBeTruthy();
    const component = spectator.component;
    const processedData = component.processedData();
    expect(processedData.sections).toHaveLength(0);
  });
});
