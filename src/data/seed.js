const svgToDataUri = (markup) => `data:image/svg+xml;utf8,${encodeURIComponent(markup)}`;

const decisionPreview = (title, variant) =>
  svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${variant === 'before' ? '#F4F4F4' : '#FFF1EC'}" />
          <stop offset="100%" stop-color="${variant === 'before' ? '#D1D1D1' : '#FFB08F'}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="800" rx="32" fill="url(#g)" />
      <rect x="84" y="84" width="1032" height="92" rx="18" fill="${variant === 'before' ? '#FFFFFF' : '#0A0A0A'}" opacity="0.95" />
      <rect x="84" y="220" width="472" height="432" rx="26" fill="${variant === 'before' ? '#FFFFFF' : '#FFF8F4'}" />
      <rect x="604" y="220" width="512" height="188" rx="26" fill="${variant === 'before' ? '#FFFFFF' : '#FFFFFF'}" />
      <rect x="604" y="444" width="512" height="208" rx="26" fill="${variant === 'before' ? '#EBEBEB' : '#FFE1D4'}" />
      <text x="112" y="142" fill="${variant === 'before' ? '#0A0A0A' : '#FFFFFF'}" font-family="JetBrains Mono, monospace" font-size="34" font-weight="700">${title}</text>
      <text x="112" y="742" fill="#555555" font-family="JetBrains Mono, monospace" font-size="22">${variant === 'before' ? 'Before exploration' : 'After decision applied'}</text>
    </svg>
  `);

export const categories = [
  'Branding',
  'Mobile App',
  'Web App',
  'Dashboard',
  'Landing Page',
  'Design System',
  'Other',
];

export const presetColors = [
  '#FF4802',
  '#0A0A0A',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#14B8A6',
  '#E11D48',
  '#64748B',
  '#F97316',
  '#22C55E',
];

const now = new Date().toISOString();

export const seedProjects = [
  {
    id: 'proj-aurora',
    name: 'Aurora Commerce',
    description: 'B2B dashboard redesign documenting key conversion and IA choices across the admin workflow.',
    category: 'Dashboard',
    color: '#FF4802',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'proj-bento',
    name: 'Bento Mobile',
    description: 'Mobile checkout refresh focused on trust, fewer taps, and clearer summary states.',
    category: 'Mobile App',
    color: '#3B82F6',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'proj-polaris',
    name: 'Polaris DS',
    description: 'Internal design system archive for tokens, interaction patterns, and component rationale.',
    category: 'Design System',
    color: '#10B981',
    createdAt: now,
    updatedAt: now,
  },
];

export const seedDecisions = [
  {
    id: 'dec-hero-nav',
    projectId: 'proj-aurora',
    title: 'Moved KPI cards above the fold',
    description: 'Reordered the dashboard so decision-makers see revenue, open tasks, and risk immediately on load.',
    rationale: 'Stakeholder reviews kept starting with “where are the numbers?” and user testing showed delayed orientation when metrics were buried below activity modules.',
    advantages: ['Faster scan of business health', 'Supports executive walkthroughs', 'Makes the landing state feel more purposeful'],
    disadvantages: ['Secondary modules moved lower', 'Requires tighter content hierarchy'],
    tags: ['IA', 'Dashboard', 'Metrics'],
    status: 'Implemented',
    dateChanged: '2026-04-17',
    createdAt: now,
    updatedAt: now,
    beforeImageUrl: decisionPreview('KPI layout', 'before'),
    afterImageUrl: decisionPreview('KPI layout', 'after'),
  },
  {
    id: 'dec-checkout-summary',
    projectId: 'proj-bento',
    title: 'Pinned order summary during checkout',
    description: 'Made pricing and selected items persist while the user moves through delivery and payment.',
    rationale: 'Drop-off interviews showed users lost confidence when they could not verify totals while progressing through multi-step checkout.',
    advantages: ['Reduces uncertainty', 'Cuts backtracking', 'Improves price transparency'],
    disadvantages: ['Consumes vertical space on smaller screens'],
    tags: ['Checkout', 'Trust', 'Mobile'],
    status: 'Shipped',
    dateChanged: '2026-04-12',
    createdAt: now,
    updatedAt: now,
    beforeImageUrl: decisionPreview('Checkout summary', 'before'),
    afterImageUrl: decisionPreview('Checkout summary', 'after'),
  },
  {
    id: 'dec-token-labels',
    projectId: 'proj-polaris',
    title: 'Renamed semantic color tokens by intent',
    description: 'Shifted token names from raw hues to usage-based names like surface, accent, success, and warning.',
    rationale: 'Engineers and designers were applying tokens inconsistently because naming reflected palette values instead of intended behavior.',
    advantages: ['Improves handoff clarity', 'Makes future theme changes safer', 'Supports better documentation'],
    disadvantages: ['Migration needs coordination across existing files'],
    tags: ['Tokens', 'Naming', 'System'],
    status: 'Draft',
    dateChanged: '2026-04-08',
    createdAt: now,
    updatedAt: now,
    beforeImageUrl: decisionPreview('Token naming', 'before'),
    afterImageUrl: decisionPreview('Token naming', 'after'),
  },
];
