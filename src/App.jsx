import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ClipboardPaste,
  Check,
  ChevronLeft,
  Ellipsis,
  ExternalLink,
  Eye,
  Copy,
  FolderPlus,
  Image as ImageIcon,
  Pencil,
  Play,
  Plus,
  Search,
  Settings,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { categories, presetColors } from './data/seed';
import { sqlSetupBlocks, testSupabaseConnection } from './lib/supabase';
import { useDDLStore } from './store/useDDLStore';

const statuses = ['All', 'Draft', 'Implemented', 'Shipped'];

const emptyProjectForm = {
  name: '',
  description: '',
  category: categories[0],
  color: presetColors[0],
};

const createDecisionForm = () => ({
  title: '',
  description: '',
  rationale: '',
  advantages: [''],
  disadvantages: [''],
  tags: [],
  tagsInput: '',
  status: 'Draft',
  dateChanged: new Date().toISOString().slice(0, 10),
  beforeImageUrl: '',
  afterImageUrl: '',
});

const formatDate = (value) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

const statusClass = {
  Draft: 'badge-draft',
  Implemented: 'badge-implemented',
  Shipped: 'badge-shipped',
};

const createId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const createDemoDecision = (project, projectDecisionCount = 0) => {
  const accent = project.color || '#FF4802';
  const svg = (label, tone) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="${tone === 'before' ? '#F4F4F4' : '#FFF1EC'}" />
            <stop offset="100%" stop-color="${tone === 'before' ? '#D9D9D9' : accent}" />
          </linearGradient>
        </defs>
        <rect width="1200" height="800" rx="28" fill="url(#g)" />
        <rect x="72" y="72" width="1056" height="90" rx="18" fill="#FFFFFF" opacity="0.95" />
        <rect x="72" y="210" width="500" height="500" rx="28" fill="#FFFFFF" opacity="0.95" />
        <rect x="620" y="210" width="508" height="220" rx="28" fill="#FFFFFF" opacity="0.95" />
        <rect x="620" y="462" width="508" height="248" rx="28" fill="#FFFFFF" opacity="0.72" />
        <text x="110" y="130" font-family="JetBrains Mono, monospace" font-size="34" font-weight="700" fill="#0A0A0A">${project.name}</text>
        <text x="110" y="758" font-family="JetBrains Mono, monospace" font-size="22" fill="#555555">${label}</text>
      </svg>
    `)}`;

  return {
    title: projectDecisionCount ? `Refined ${project.name} interaction state` : `First decision for ${project.name}`,
    description: projectDecisionCount
      ? 'Documented a clearer revision so this new project has a visible timeline from the start.'
      : 'Created a starter decision so the timeline, detail view, and presentation mode all feel populated immediately.',
    rationale:
      'A fresh project feels empty without a first recorded choice. This starter entry helps review the whole product flow before Supabase is connected.',
    advantages: ['Makes the prototype feel complete', 'Lets you test detail screens immediately', 'Creates visible before and after states'],
    disadvantages: ['Starter content will be replaced with your real decisions later'],
    tags: ['Prototype', project.category, 'Starter'],
    status: 'Draft',
    dateChanged: new Date().toISOString().slice(0, 10),
    beforeImageUrl: svg('Before exploration', 'before'),
    afterImageUrl: svg('After first recorded decision', 'after'),
  };
};

function App() {
  const splashComplete = useDDLStore((state) => state.splashComplete);
  const setSplashComplete = useDDLStore((state) => state.setSplashComplete);
  const init = useDDLStore((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  if (!splashComplete) {
    return <SplashScreen onComplete={setSplashComplete} />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/dashboard" element={<DashboardGate />} />
      <Route path="/project/:projectId" element={<ProjectRoute readOnly={false} />} />
      <Route path="/project/:projectId/decision/:decisionId" element={<DecisionRoute readOnly={false} />} />
      <Route path="/share/:projectId" element={<ProjectRoute readOnly />} />
      <Route path="/share/:projectId/decision/:decisionId" element={<DecisionRoute readOnly />} />
    </Routes>
  );
}

function SplashScreen({ onComplete }) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onComplete();
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="splash-screen">
      <div className="splash-grid" />
      <div className="splash-panel">
        <div className="eyebrow">Splash Name</div>
        <h1>TRACE</h1>
        <p>DDL // Design Decision Log</p>
        <span>Capture the why behind every design move.</span>
      </div>
    </div>
  );
}

function HomeRoute() {
  const config = useDDLStore((state) => state.config);

  if (!config.url || !config.anonKey) {
    return <SetupScreen />;
  }

  return <Navigate to="/dashboard" replace />;
}

function DashboardGate() {
  const config = useDDLStore((state) => state.config);

  if (!config.url || !config.anonKey) {
    return <Navigate to="/" replace />;
  }

  return <DashboardPage />;
}

function SetupScreen() {
  const config = useDDLStore((state) => state.config);
  const setConfig = useDDLStore((state) => state.setConfig);
  const [form, setForm] = useState({
    url: config.url,
    anonKey: config.anonKey,
  });
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [copied, setCopied] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: 'loading', message: 'Testing connection...' });
    const result = await testSupabaseConnection(form.url, form.anonKey);

    if (!result.ok) {
      setStatus({ type: 'error', message: result.message });
      return;
    }

    setConfig(form);
    setStatus({ type: 'success', message: result.message });
  };

  const handleCopy = async (value, label) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1500);
  };

  const continueInDemoMode = () => {
    setConfig({
      url: 'demo-mode',
      anonKey: 'demo-mode',
    });
  };

  return (
    <div className="setup-shell">
      <div className="setup-hero">
        <div className="eyebrow">First Launch</div>
        <h1>DDL // connect your private workspace</h1>
        <p>
          This setup follows your PRD: single-user, no auth wall, Supabase-backed, and ready for project
          archives, decision timelines, presentation mode, and share views.
        </p>
        <div className="hero-metrics">
          <Metric label="Build Type" value="Frontend foundation" />
          <Metric label="Splash" value="TRACE" />
          <Metric label="Stack" value="React + Zustand + Supabase" />
        </div>
      </div>

      <div className="setup-card-grid">
        <section className="panel panel-form">
          <div className="section-heading">
            <span className="eyebrow">Setup</span>
            <h2>Supabase Connection</h2>
          </div>
          <form className="stack-20" onSubmit={handleSubmit}>
            <Field
              label="Supabase Project URL"
              value={form.url}
              onChange={(value) => setForm((current) => ({ ...current, url: value }))}
              placeholder="https://your-project.supabase.co"
            />
            <Field
              label="Anon Public Key"
              value={form.anonKey}
              onChange={(value) => setForm((current) => ({ ...current, anonKey: value }))}
              placeholder="eyJhbGciOi..."
              multiline
            />
            <div className="button-row">
              <button className="btn btn-primary" type="submit" disabled={status.type === 'loading'}>
                <Check size={16} />
                {status.type === 'loading' ? 'Testing...' : 'Save and continue'}
              </button>
              <button className="btn btn-ghost" type="button" onClick={continueInDemoMode}>
                <Play size={16} />
                Continue in demo mode
              </button>
            </div>
            {status.message ? (
              <div className={`toast ${status.type === 'error' ? 'toast-error' : 'toast-success'}`}>
                <div className={`toast-dot ${status.type === 'error' ? 'toast-dot-e' : 'toast-dot-s'}`} />
                <span>{status.message}</span>
              </div>
            ) : null}
            <div className="inline-link-row">
              <button className="text-link" type="button" onClick={continueInDemoMode}>
                Skip setup for now and review the product flows
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="section-heading">
            <span className="eyebrow">SQL</span>
            <h2>One-time database setup</h2>
          </div>
          <p className="panel-copy">
            If you only want to review the prototype first, use <strong>Continue in demo mode</strong>. You can
            connect Supabase later without changing the frontend direction.
          </p>
          <div className="sql-stack">
            {sqlSetupBlocks.map((block, index) => (
              <div className="sql-card" key={block}>
                <div className="sql-card-head">
                  <span>Block {index + 1}</span>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => handleCopy(block, `block-${index}`)}>
                    <Copy size={14} />
                    {copied === `block-${index}` ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre>{block}</pre>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const projects = useDDLStore((state) => state.projects);
  const decisions = useDDLStore((state) => state.decisions);
  const clearConfig = useDDLStore((state) => state.clearConfig);
  const addProject = useDDLStore((state) => state.addProject);
  const updateProject = useDDLStore((state) => state.updateProject);
  const deleteProject = useDDLStore((state) => state.deleteProject);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [modalState, setModalState] = useState({ type: '', project: null });
  const [quickActions, setQuickActions] = useState(null);

  useEffect(() => {
    if (!quickActions) {
      return undefined;
    }

    const handleClose = () => setQuickActions(null);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [quickActions]);

  const filteredProjects = projects.filter((project) => {
    const matchesCategory = selectedCategory === 'All' || project.category === selectedCategory;
    const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const projectMetrics = projects.map((project) => {
    const projectDecisions = decisions.filter((decision) => decision.projectId === project.id);
    return {
      ...project,
      decisionCount: projectDecisions.length,
      lastUpdated: projectDecisions[0]?.updatedAt || project.updatedAt,
    };
  });

  return (
    <AppShell
      title="Projects Dashboard"
      description="Track every product decision across projects, then walk any story back with confidence."
      actions={
        <>
          <button className="btn btn-ghost" type="button" onClick={() => clearConfig()}>
            <Settings size={16} />
            Reset setup
          </button>
          <button className="btn btn-primary" type="button" onClick={() => setModalState({ type: 'create', project: null })}>
            <FolderPlus size={16} />
            Create new project
          </button>
        </>
      }
    >
      <section className="dashboard-overview panel">
        <div className="overview-copy">
          <div className="eyebrow">Flow map</div>
          <h2>Prototype journey from setup to share-ready storytelling</h2>
          <p>
            This build now connects the V1 screens as a usable flow: setup, dashboard, project timeline,
            decision detail, presentation mode, and public share view.
          </p>
        </div>
        <div className="overview-steps">
          <FlowStep index="01" title="Setup" body="Enter Supabase later or continue in demo mode right now." />
          <FlowStep index="02" title="Projects" body="Create, filter, search, edit, or remove projects from the dashboard." />
          <FlowStep index="03" title="Decisions" body="Open decision cards into full detail pages with images and rationale." />
          <FlowStep index="04" title="Share" body="Preview the read-only public flow and presentation mode before backend wiring." />
        </div>
      </section>
      <section className="dashboard-toolbar" data-print-hidden="true">
        <label className="search-field">
          <Search size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search project name" />
        </label>
        <div className="filter-row">
          {['All', ...categories].map((category) => (
            <button
              key={category}
              className={`chip ${selectedCategory === category ? 'chip-active' : ''}`}
              type="button"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {filteredProjects.length ? (
        <section className="projects-grid">
          {projectMetrics
            .filter((project) => filteredProjects.some((item) => item.id === project.id))
            .map((project) => (
              <article
                className="project-card card interactive"
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  setQuickActions({
                    project,
                    x: event.clientX,
                    y: event.clientY,
                  });
                }}
              >
                <div className="project-card-accent" style={{ background: project.color }} />
                <div className="project-card-top">
                  <div>
                    <h3 className="project-card-name">{project.name}</h3>
                    <span className="badge badge-brand">{project.category}</span>
                  </div>
                  <div className="card-menu" data-print-hidden="true">
                    <button
                      className="btn btn-icon"
                      type="button"
                      aria-label={`Edit ${project.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setModalState({ type: 'edit', project });
                      }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="btn btn-icon"
                      type="button"
                      aria-label={`Delete ${project.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (window.confirm(`Delete ${project.name} and all its decisions?`)) {
                          deleteProject(project.id);
                        }
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                    <button
                      className="btn btn-icon"
                      type="button"
                      aria-label={`Quick actions for ${project.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        const rect = event.currentTarget.getBoundingClientRect();
                        setQuickActions({
                          project,
                          x: rect.left,
                          y: rect.bottom + 8,
                        });
                      }}
                    >
                      <Ellipsis size={15} />
                    </button>
                  </div>
                </div>
                <p className="project-card-desc">{project.description || 'No description yet.'}</p>
                <div className="project-card-footer">
                  <span className="project-card-count">{project.decisionCount} decisions</span>
                  <span className="project-card-date">Updated {formatDate(project.lastUpdated)}</span>
                </div>
              </article>
            ))}
        </section>
      ) : (
        <EmptyState
          title="No projects match this filter"
          description="Try another category, change your search, or create the first project to start logging decisions."
          actionLabel="Create project"
          onAction={() => setModalState({ type: 'create', project: null })}
        />
      )}

      {modalState.type ? (
        <ProjectModal
          project={modalState.project}
          onClose={() => setModalState({ type: '', project: null })}
          onSave={(payload) => {
            if (modalState.type === 'create') {
              const projectId = createId('proj');
              addProject({ ...payload, id: projectId });
              navigate(`/project/${projectId}`, { state: { openNewDecision: true } });
            } else if (modalState.project) {
              updateProject(modalState.project.id, payload);
            }
            setModalState({ type: '', project: null });
          }}
        />
      ) : null}
      {quickActions ? (
        <QuickActionsMenu
          x={quickActions.x}
          y={quickActions.y}
          onEdit={() => {
            setModalState({ type: 'edit', project: quickActions.project });
            setQuickActions(null);
          }}
          onDelete={() => {
            if (window.confirm(`Delete ${quickActions.project.name} and all its decisions?`)) {
              deleteProject(quickActions.project.id);
            }
            setQuickActions(null);
          }}
        />
      ) : null}
    </AppShell>
  );
}

function ProjectRoute({ readOnly }) {
  const params = useParams();
  const project = useDDLStore((state) => state.getProjectById(params.projectId));

  if (!project) {
    return (
      <AppShell title="Project not found" description="This project id is missing from local state.">
        <EmptyState title="Missing project" description="The project may have been deleted or not loaded yet." />
      </AppShell>
    );
  }

  return <ProjectPage project={project} readOnly={readOnly} />;
}

function DecisionRoute({ readOnly }) {
  const params = useParams();
  const project = useDDLStore((state) => state.getProjectById(params.projectId));
  const decision = useDDLStore((state) => state.getDecisionById(params.decisionId));

  if (!project || !decision || decision.projectId !== project.id) {
    return (
      <AppShell title="Decision not found" description="This decision route is missing from local state.">
        <EmptyState title="Missing decision" description="The decision may have been deleted or the URL is incomplete." />
      </AppShell>
    );
  }

  return <DecisionPage project={project} decision={decision} readOnly={readOnly} />;
}

function ProjectPage({ project, readOnly }) {
  const navigate = useNavigate();
  const location = useLocation();
  const allDecisions = useDDLStore((state) => state.decisions);
  const addDecision = useDDLStore((state) => state.addDecision);
  const updateDecision = useDDLStore((state) => state.updateDecision);
  const deleteDecision = useDDLStore((state) => state.deleteDecision);
  const updateProject = useDDLStore((state) => state.updateProject);
  const deleteProject = useDDLStore((state) => state.deleteProject);
  const [selectedTag, setSelectedTag] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [formState, setFormState] = useState({ open: false, decision: null });
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const decisions = useMemo(
    () => allDecisions.filter((decision) => decision.projectId === project.id),
    [allDecisions, project.id],
  );

  const tags = Array.from(new Set(decisions.flatMap((decision) => decision.tags || [])));

  const visibleDecisions = decisions
    .filter((decision) => selectedTag === 'All' || (decision.tags || []).includes(selectedTag))
    .filter((decision) => selectedStatus === 'All' || decision.status === selectedStatus)
    .sort((left, right) => new Date(right.dateChanged) - new Date(left.dateChanged));

  const decisionsThisMonth = visibleDecisions.filter((decision) => {
    const now = new Date();
    const changed = new Date(decision.dateChanged);
    return changed.getMonth() === now.getMonth() && changed.getFullYear() === now.getFullYear();
  }).length;

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/share/${project.id}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => {
    if (readOnly) {
      return;
    }

    if (location.state?.openNewDecision) {
      setFormState({ open: true, decision: null });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate, readOnly]);

  return (
    <AppShell
      title={project.name}
      description={project.description || 'Project description pending.'}
      actions={
        <>
          <button className="btn btn-ghost" type="button" onClick={() => navigate('/dashboard')}>
            <ChevronLeft size={16} />
            Back
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => window.print()}>
            <Share2 size={16} />
            Export PDF
          </button>
          {!readOnly ? (
            <button className="btn btn-ghost" type="button" onClick={() => setProjectFormOpen(true)}>
              <Pencil size={16} />
              Edit project
            </button>
          ) : null}
          <button className="btn btn-ghost" type="button" onClick={handleShare}>
            <Copy size={16} />
            {copied ? 'Copied share link' : 'Copy share link'}
          </button>
          <button className="btn btn-primary" type="button" onClick={() => setPresentationOpen(true)}>
            <Play size={16} />
            Presentation mode
          </button>
        </>
      }
    >
      {readOnly ? (
        <section className="share-hero panel">
          <div className="overview-copy">
            <div className="eyebrow">Public share view</div>
            <h2>{project.name} in read-only mode</h2>
            <p>
              This route mirrors the share-link experience from the PRD: content-first, no edit controls,
              presentation mode still available, and decision detail pages kept readable for portfolio or client walkthroughs.
            </p>
          </div>
          <div className="share-hero-actions">
            <button className="btn btn-ghost" type="button" onClick={() => navigate(`/project/${project.id}`)}>
              <Eye size={16} />
              Open editable view
            </button>
          </div>
        </section>
      ) : null}
      <section className="project-header panel">
        <div className="project-header-top">
          <div>
            <div className="eyebrow">Project detail</div>
            <h2>{project.name}</h2>
          </div>
          <div className="header-badges">
            <span className="badge badge-brand">{project.category}</span>
            <span className="badge badge-dark" style={{ background: project.color }}>
              Accent {project.color}
            </span>
          </div>
        </div>
        <div className="stats-grid">
          <Metric label="Total decisions" value={String(decisions.length).padStart(2, '0')} />
          <Metric label="This month" value={String(decisionsThisMonth).padStart(2, '0')} />
          <Metric label="Last updated" value={formatDate(project.updatedAt)} />
        </div>
      </section>

      {!readOnly ? (
        <section className="project-workspace panel">
          <div className="project-workspace-copy">
            <div className="eyebrow">Decision workspace</div>
            <h3>Manage this project after opening the card</h3>
            <p>
              From here you should be able to add new design decisions, review existing ones, edit them,
              delete them, and move into presentation or share flows without going back to the dashboard.
            </p>
          </div>
          <div className="project-workspace-actions">
            <button className="btn btn-primary" type="button" onClick={() => setFormState({ open: true, decision: null })}>
              <Plus size={16} />
              Add new decision
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => addDecision(project.id, createDemoDecision(project, decisions.length))}
            >
              <Play size={16} />
              Generate starter decision
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => setProjectFormOpen(true)}>
              <Pencil size={16} />
              Edit project details
            </button>
            <button
              className="btn btn-danger"
              type="button"
              onClick={() => {
                if (window.confirm(`Delete ${project.name} and all its decisions?`)) {
                  deleteProject(project.id);
                  navigate('/dashboard');
                }
              }}
            >
              <Trash2 size={16} />
              Delete project
            </button>
          </div>
        </section>
      ) : null}

      <section className="dashboard-toolbar" data-print-hidden="true">
        <div className="filter-group">
          <div className="eyebrow">Tags</div>
          <div className="filter-row">
            {['All', ...tags].map((tag) => (
              <button
                key={tag}
                className={`chip ${selectedTag === tag ? 'chip-active' : ''}`}
                type="button"
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <div className="eyebrow">Status</div>
          <div className="filter-row">
            {statuses.map((status) => (
              <button
                key={status}
                className={`chip ${selectedStatus === status ? 'chip-active' : ''}`}
                type="button"
                onClick={() => setSelectedStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        {!readOnly ? (
          <div className="button-row">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => addDecision(project.id, createDemoDecision(project, decisions.length))}
            >
              <Play size={16} />
              Add starter decision
            </button>
            <button className="btn btn-primary" type="button" onClick={() => setFormState({ open: true, decision: null })}>
              <Plus size={16} />
              Add new decision
            </button>
          </div>
        ) : null}
      </section>

      {visibleDecisions.length ? (
        <section className="decision-section">
          <div className="section-heading-row">
            <div>
              <div className="eyebrow">Decision timeline</div>
              <h3>{visibleDecisions.length} decisions in view</h3>
            </div>
          </div>
          <div className="decision-timeline">
          {visibleDecisions.map((decision) => (
            <article
              className="card decision-card interactive"
              key={decision.id}
              onClick={() =>
                navigate(readOnly ? `/share/${project.id}/decision/${decision.id}` : `/project/${project.id}/decision/${decision.id}`)
              }
            >
              <div className="decision-img-row">
                <div className="decision-img-before">
                  <img alt={`${decision.title} before`} src={decision.beforeImageUrl} />
                </div>
                <div className="decision-img-arrow">
                  <ArrowRight size={18} />
                </div>
                <div className="decision-img-after">
                  <img alt={`${decision.title} after`} src={decision.afterImageUrl} />
                </div>
              </div>
              <div className="decision-body">
                <div className="decision-title-row">
                  <h3 className="decision-title">{decision.title}</h3>
                  <span className="decision-date">{formatDate(decision.dateChanged)}</span>
                </div>
                <p className="decision-desc">{decision.description}</p>
                {!readOnly ? (
                  <div className="decision-card-actions" data-print-hidden="true">
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setFormState({ open: true, decision });
                      }}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (window.confirm(`Delete "${decision.title}"?`)) {
                          deleteDecision(decision.id);
                        }
                      }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                ) : null}
                <div className="decision-chips">
                  <span className={`badge ${statusClass[decision.status]}`}>{decision.status}</span>
                  {(decision.tags || []).slice(0, 3).map((tag, index) => (
                    <span className={`tag tag-${(index % 8) + 1}`} key={tag}>
                      {tag}
                    </span>
                  ))}
                  {(decision.tags || []).length > 3 ? <span className="tag tag-6">+{decision.tags.length - 3}</span> : null}
                  <span className="decision-open-hint">
                    <ExternalLink size={12} />
                    Open detail
                  </span>
                </div>
              </div>
            </article>
          ))}
          </div>
        </section>
      ) : (
        <EmptyState
          title={decisions.length ? 'No decisions in this filter' : 'This project needs its first design decision'}
          description={
            decisions.length
              ? 'Adjust the tag/status filters or add a new decision to start building the project story.'
              : 'Start with one real or starter decision so you can test timeline cards, detail pages, uploads, and presentation mode end to end.'
          }
          actionLabel={readOnly ? '' : decisions.length ? 'Add decision' : 'Add first decision'}
          onAction={readOnly ? undefined : () => setFormState({ open: true, decision: null })}
          secondaryActionLabel={!readOnly && !decisions.length ? 'Generate starter decision' : ''}
          onSecondaryAction={!readOnly && !decisions.length ? () => addDecision(project.id, createDemoDecision(project, decisions.length)) : undefined}
        />
      )}

      {!readOnly && formState.open ? (
        <DecisionModal
          project={project}
          decision={formState.decision}
          decisions={decisions}
          onClose={() => setFormState({ open: false, decision: null })}
          onSave={(payload) => {
            if (formState.decision) {
              updateDecision(formState.decision.id, payload);
            } else {
              addDecision(project.id, payload);
            }
            setFormState({ open: false, decision: null });
          }}
        />
      ) : null}

      {!readOnly && projectFormOpen ? (
        <ProjectModal
          project={project}
          onClose={() => setProjectFormOpen(false)}
          onSave={(payload) => {
            updateProject(project.id, payload);
            setProjectFormOpen(false);
          }}
        />
      ) : null}

      {presentationOpen ? (
        <PresentationMode decisions={visibleDecisions} project={project} onClose={() => setPresentationOpen(false)} />
      ) : null}
    </AppShell>
  );
}

function DecisionPage({ project, decision, readOnly }) {
  const navigate = useNavigate();
  const allDecisions = useDDLStore((state) => state.decisions);
  const updateDecision = useDDLStore((state) => state.updateDecision);
  const deleteDecision = useDDLStore((state) => state.deleteDecision);
  const [formState, setFormState] = useState({ open: false, decision: null });
  const [lightbox, setLightbox] = useState('');
  const decisions = useMemo(
    () =>
      allDecisions
        .filter((item) => item.projectId === project.id)
        .sort((left, right) => new Date(right.dateChanged) - new Date(left.dateChanged)),
    [allDecisions, project.id],
  );
  const index = decisions.findIndex((item) => item.id === decision.id);
  const previous = index > 0 ? decisions[index - 1] : null;
  const next = index < decisions.length - 1 ? decisions[index + 1] : null;

  const basePath = readOnly ? `/share/${project.id}` : `/project/${project.id}`;

  return (
    <AppShell
      title={decision.title}
      description={`${project.name} // ${decision.status} // changed ${formatDate(decision.dateChanged)}`}
      actions={
        <>
          <button className="btn btn-ghost" type="button" onClick={() => navigate(basePath)}>
            <ChevronLeft size={16} />
            Back to project
          </button>
          {!readOnly ? (
            <button className="btn btn-primary" type="button" onClick={() => setFormState({ open: true, decision })}>
              <Pencil size={16} />
              Edit decision
            </button>
          ) : null}
        </>
      }
    >
      <section className="decision-page-layout">
        <div className="decision-content-panel panel">
          <div className="decision-page-top">
            <div className="decision-title-wrap">
              <span className={`badge ${statusClass[decision.status]}`}>{decision.status}</span>
              <h2>{decision.title}</h2>
              <p>
                Date changed: {formatDate(decision.dateChanged)} | Logged: {formatDate(decision.createdAt)}
              </p>
            </div>
            <div className="decision-action-stack" data-print-hidden="true">
              <button className="btn btn-ghost" type="button" onClick={() => setLightbox(decision.beforeImageUrl)}>
                <ImageIcon size={16} />
                Expand before
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setLightbox(decision.afterImageUrl)}>
                <ImageIcon size={16} />
                Expand after
              </button>
            </div>
          </div>
          <div className="detail-grid">
            <button className="image-stage" type="button" onClick={() => setLightbox(decision.beforeImageUrl)}>
              <span className="image-stage-label">Before</span>
              <img alt={`${decision.title} before`} src={decision.beforeImageUrl} />
            </button>
            <button className="image-stage" type="button" onClick={() => setLightbox(decision.afterImageUrl)}>
              <span className="image-stage-label">After</span>
              <img alt={`${decision.title} after`} src={decision.afterImageUrl} />
            </button>
          </div>
          <div className="detail-grid detail-text-grid">
            <SectionBlock label="Description" body={decision.description} />
            <SectionBlock label="Rationale" body={decision.rationale} />
          </div>
          <div className="detail-grid detail-text-grid">
            <ListBlock label="Advantages" items={decision.advantages} />
            {decision.disadvantages?.length ? <ListBlock label="Disadvantages" items={decision.disadvantages} /> : <div />}
          </div>
          <div className="decision-chips">
            {(decision.tags || []).map((tag, indexValue) => (
              <span className={`tag tag-${(indexValue % 8) + 1}`} key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <aside className="decision-side-panel">
          <div className="panel">
            <div className="eyebrow">Navigation</div>
            <div className="stack-20">
              <button
                className="btn btn-ghost"
                type="button"
                disabled={!previous}
                onClick={() => previous && navigate(`${basePath}/decision/${previous.id}`)}
              >
                <ArrowLeft size={16} />
                Previous decision
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                disabled={!next}
                onClick={() => next && navigate(`${basePath}/decision/${next.id}`)}
              >
                Next decision
                <ArrowRight size={16} />
              </button>
              {!readOnly ? (
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete "${decision.title}"?`)) {
                      deleteDecision(decision.id);
                      navigate(`/project/${project.id}`);
                    }
                  }}
                >
                  <Trash2 size={16} />
                  Delete decision
                </button>
              ) : null}
            </div>
          </div>
          <div className="panel">
            <div className="eyebrow">Project context</div>
            <h3 className="side-panel-title">{project.name}</h3>
            <p className="side-panel-copy">{project.description || 'Project description pending.'}</p>
          </div>
        </aside>
      </section>

      {!readOnly && formState.open ? (
        <DecisionModal
          project={project}
          decision={formState.decision}
          decisions={decisions}
          onClose={() => setFormState({ open: false, decision: null })}
          onSave={(payload) => {
            updateDecision(decision.id, payload);
            setFormState({ open: false, decision: null });
          }}
        />
      ) : null}

      {lightbox ? <ImageLightbox src={lightbox} onClose={() => setLightbox('')} /> : null}
    </AppShell>
  );
}

function AppShell({ title, description, actions, children }) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar" data-print-hidden="true">
        <div>
          <div className="sidebar-brand">
            <span>DDL</span>
            <small>TRACE</small>
          </div>
          <p className="sidebar-copy">A decision archive for product design stories, rationale, and evolution.</p>
        </div>
        <div className="sidebar-panel">
          <div className="eyebrow">Core features</div>
          <ul>
            <li>Projects dashboard</li>
            <li>Decision timeline</li>
            <li>Presentation mode</li>
            <li>Share-ready read only views</li>
          </ul>
        </div>
      </aside>
      <main className="app-main">
        <header className="topbar" data-print-hidden="true">
          <div>
            <div className="eyebrow">Design Decision Log</div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="button-row">{actions}</div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

function ProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState(project || emptyProjectForm);

  return (
    <ModalFrame title={project ? 'Edit project' : 'Create project'} onClose={onClose}>
      <form
        className="stack-20"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <Field label="Project name" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
        <Field
          label="Description"
          value={form.description}
          multiline
          onChange={(value) => setForm((current) => ({ ...current, description: value }))}
        />
        <SelectField
          label="Category"
          value={form.category}
          onChange={(value) => setForm((current) => ({ ...current, category: value }))}
          options={categories}
        />
        <ReadOnlyField label="Created date" value={project?.createdAt ? formatDate(project.createdAt) : 'Auto-set on save'} />
        <ColorPicker
          value={form.color}
          onChange={(value) => setForm((current) => ({ ...current, color: value }))}
        />
        <div className="button-row">
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" type="submit" disabled={!form.name.trim()}>
            Save project
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

function DecisionModal({ project, decision, decisions, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    ...(decision || createDecisionForm()),
    tagsInput: (decision?.tags || []).join(', '),
  }));
  const [restoreAvailable, setRestoreAvailable] = useState(false);
  const [saveTick, setSaveTick] = useState(0);

  useEffect(() => {
    const draftKey = `ddl_draft_${project.id}`;
    const saved = window.localStorage.getItem(draftKey);
    setRestoreAvailable(Boolean(saved && !decision));
  }, [decision, project.id]);

  useEffect(() => {
    const draftKey = `ddl_draft_${project.id}`;
    const interval = window.setInterval(() => {
      const payload = {
        ...form,
        beforeImageUrl: '',
        afterImageUrl: '',
      };
      window.localStorage.setItem(draftKey, JSON.stringify(payload));
      setSaveTick((current) => current + 1);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [form, project.id]);

  const restoreDraft = () => {
    const draftKey = `ddl_draft_${project.id}`;
    const saved = window.localStorage.getItem(draftKey);
    if (saved) {
      setForm(JSON.parse(saved));
      setRestoreAvailable(false);
    }
  };

  const setListValue = (key, index, value) => {
    setForm((current) => ({
      ...current,
      [key]: current[key].map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  };

  const addListItem = (key) => {
    setForm((current) => ({
      ...current,
      [key]: [...current[key], ''],
    }));
  };

  const removeListItem = (key, index) => {
    setForm((current) => ({
      ...current,
      [key]: current[key].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleImageFile = (key, file) => {
    if (!file) {
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setForm((current) => ({
      ...current,
      [key]: imageUrl,
    }));
  };

  const existingTags = Array.from(new Set(decisions.flatMap((item) => item.tags || [])));

  const handleClipboardImage = async (key) => {
    const imageUrl = await readClipboardImage();
    if (imageUrl) {
      setForm((current) => ({
        ...current,
        [key]: imageUrl,
      }));
    }
  };

  return (
    <ModalFrame title={decision ? 'Edit decision' : 'Add decision'} onClose={onClose} wide>
      <form
        className="stack-20"
        onSubmit={(event) => {
          event.preventDefault();
          const payload = {
            ...form,
            tags: form.tagsInput
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean),
            advantages: form.advantages.filter(Boolean),
            disadvantages: form.disadvantages.filter(Boolean),
          };
          delete payload.tagsInput;
          onSave(payload);
          window.localStorage.removeItem(`ddl_draft_${project.id}`);
        }}
      >
        {restoreAvailable ? (
          <div className="restore-banner">
            <div>
              <strong>Saved draft detected.</strong>
              <p>You can restore your last unsent decision draft for this project.</p>
            </div>
            <button className="btn btn-secondary btn-sm" type="button" onClick={restoreDraft}>
              Restore draft
            </button>
          </div>
        ) : null}
        <Field label="Title" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
        <Field
          label="Description"
          value={form.description}
          multiline
          onChange={(value) => setForm((current) => ({ ...current, description: value }))}
        />
        <Field
          label="Rationale"
          value={form.rationale}
          multiline
          onChange={(value) => setForm((current) => ({ ...current, rationale: value }))}
        />
        <div className="two-col">
          <ListEditor
            label="Advantages"
            items={form.advantages}
            onAdd={() => addListItem('advantages')}
            onChange={(index, value) => setListValue('advantages', index, value)}
            onRemove={(index) => removeListItem('advantages', index)}
          />
          <ListEditor
            label="Disadvantages"
            items={form.disadvantages}
            onAdd={() => addListItem('disadvantages')}
            onChange={(index, value) => setListValue('disadvantages', index, value)}
            onRemove={(index) => removeListItem('disadvantages', index)}
          />
        </div>
        <div className="two-col">
          <ImageField
            label="Before image"
            value={form.beforeImageUrl}
            onUrlChange={(value) => setForm((current) => ({ ...current, beforeImageUrl: value }))}
            onFileChange={(file) => handleImageFile('beforeImageUrl', file)}
            onPasteFromClipboard={() => handleClipboardImage('beforeImageUrl')}
          />
          <ImageField
            label="After image"
            value={form.afterImageUrl}
            onUrlChange={(value) => setForm((current) => ({ ...current, afterImageUrl: value }))}
            onFileChange={(file) => handleImageFile('afterImageUrl', file)}
            onPasteFromClipboard={() => handleClipboardImage('afterImageUrl')}
          />
        </div>
        <div className="two-col">
          <div className="field">
            <label>Tags</label>
            <input
              list="tags-list"
              value={form.tagsInput}
              onChange={(event) => setForm((current) => ({ ...current, tagsInput: event.target.value }))}
              placeholder="IA, Usability, Navigation"
            />
            <datalist id="tags-list">
              {existingTags.map((tag) => (
                <option key={tag} value={tag} />
              ))}
            </datalist>
          </div>
          <StatusRadioGroup
            label="Status"
            value={form.status}
            onChange={(value) => setForm((current) => ({ ...current, status: value }))}
            options={statuses.filter((item) => item !== 'All')}
          />
        </div>
        <Field
          label="Date changed"
          value={form.dateChanged}
          type="date"
          onChange={(value) => setForm((current) => ({ ...current, dateChanged: value }))}
        />
        <ReadOnlyField
          label="Draft auto-save"
          value={saveTick ? `Saved locally ${saveTick} time(s) while this form was open` : 'Auto-saves to localStorage every 30 seconds'}
        />
        <div className="button-row">
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={!form.title.trim() || !form.description.trim() || !form.rationale.trim() || !form.advantages.some((item) => item.trim())}
          >
            Save decision
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

function DecisionDetailModal({ decision, decisions, readOnly, onClose, onEdit, onDelete, onNavigate }) {
  const index = decisions.findIndex((item) => item.id === decision.id);

  return (
    <ModalFrame title="Decision detail" onClose={onClose} wide>
      <div className="detail-grid">
        <div className="detail-images">
          <img alt={`${decision.title} before`} src={decision.beforeImageUrl} />
          <img alt={`${decision.title} after`} src={decision.afterImageUrl} />
        </div>
        <div className="detail-copy">
          <div className="decision-title-row">
            <h2>{decision.title}</h2>
            <span className={`badge ${statusClass[decision.status]}`}>{decision.status}</span>
          </div>
          <p className="detail-meta">
            Date changed: {formatDate(decision.dateChanged)} | Logged: {formatDate(decision.createdAt)}
          </p>
          <SectionBlock label="Description" body={decision.description} />
          <SectionBlock label="Rationale" body={decision.rationale} />
          <ListBlock label="Advantages" items={decision.advantages} />
          {decision.disadvantages?.length ? <ListBlock label="Disadvantages" items={decision.disadvantages} /> : null}
          <div className="decision-chips">
            {(decision.tags || []).map((tag, indexValue) => (
              <span className={`tag tag-${(indexValue % 8) + 1}`} key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="modal-footer-inline">
        <div className="button-row">
          <button
            className="btn btn-ghost"
            type="button"
            disabled={index <= 0}
            onClick={() => onNavigate(decisions[index - 1])}
          >
            <ArrowLeft size={16} />
            Previous
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={index >= decisions.length - 1}
            onClick={() => onNavigate(decisions[index + 1])}
          >
            Next
            <ArrowRight size={16} />
          </button>
        </div>
        {!readOnly ? (
          <div className="button-row">
            <button className="btn btn-ghost" type="button" onClick={onEdit}>
              <Pencil size={16} />
              Edit
            </button>
            <button className="btn btn-danger" type="button" onClick={onDelete}>
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </ModalFrame>
  );
}

function FlowStep({ index, title, body }) {
  return (
    <div className="flow-step">
      <span>{index}</span>
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function ImageLightbox({ src, onClose }) {
  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <button className="lightbox-close btn btn-icon" type="button" onClick={onClose} aria-label="Close lightbox">
        <X size={18} />
      </button>
      <img className="lightbox-image" alt="Expanded decision asset" src={src} onClick={(event) => event.stopPropagation()} />
    </div>
  );
}

function PresentationMode({ decisions, project, onClose }) {
  const [index, setIndex] = useState(0);
  const active = decisions[index];

  useEffect(() => {
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
      if (event.key === 'ArrowRight') {
        setIndex((current) => Math.min(current + 1, decisions.length - 1));
      }
      if (event.key === 'ArrowLeft') {
        setIndex((current) => Math.max(current - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [decisions.length, onClose]);

  if (!active) {
    return null;
  }

  return (
    <div className="presentation-layer">
      <div className="presentation-topbar">
        <div>
          <span className="eyebrow">Presentation mode</span>
          <h2>{project.name}</h2>
        </div>
        <div className="button-row">
          <span className="presentation-index">
            {index + 1} of {decisions.length}
          </span>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            <X size={16} />
            Exit
          </button>
        </div>
      </div>
      <div className="presentation-body">
        <div className="presentation-copy">
          <span className={`badge ${statusClass[active.status]}`}>{active.status}</span>
          <h3>{active.title}</h3>
          <p>{active.description}</p>
          <SectionBlock label="Rationale" body={active.rationale} />
          <ListBlock label="Advantages" items={active.advantages} />
          {active.disadvantages?.length ? <ListBlock label="Trade-offs" items={active.disadvantages} /> : null}
        </div>
        <div className="presentation-images">
          <img alt={`${active.title} before`} src={active.beforeImageUrl} />
          <img alt={`${active.title} after`} src={active.afterImageUrl} />
        </div>
      </div>
      <div className="presentation-nav">
        <button className="btn btn-secondary" type="button" onClick={() => setIndex((current) => Math.max(current - 1, 0))}>
          <ArrowLeft size={16} />
          Previous
        </button>
        <div className="presentation-shortcuts">Keyboard: ← previous, → next, Esc exit</div>
        <button className="btn btn-primary" type="button" onClick={() => setIndex((current) => Math.min(current + 1, decisions.length - 1))}>
          Next
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function ModalFrame({ title, onClose, wide = false, children }) {
  return (
    <div className="modal-backdrop">
      <div className={`modal-shell ${wide ? 'modal-wide' : ''}`}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn btn-icon" type="button" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, multiline = false, type = 'text', placeholder = '' }) {
  return (
    <div className="field">
      <label>{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="field">
      <label>{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="readonly-field">{value}</div>
    </div>
  );
}

function StatusRadioGroup({ label, value, onChange, options }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="status-radio-group">
        {options.map((option) => (
          <label className={`status-radio ${value === option ? 'status-radio-active' : ''}`} key={option}>
            <input type="radio" name="status" checked={value === option} onChange={() => onChange(option)} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <div className="field">
      <label>Accent color</label>
      <div className="color-picker">
        {presetColors.map((color) => (
          <button
            key={color}
            className={`color-swatch-button ${value === color ? 'active' : ''}`}
            type="button"
            style={{ background: color }}
            onClick={() => onChange(color)}
            aria-label={`Pick ${color}`}
          />
        ))}
      </div>
      <input type="text" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function ListEditor({ label, items, onAdd, onChange, onRemove }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="list-editor">
        {items.map((item, index) => (
          <div className="list-row" key={`${label}-${index}`}>
            <input value={item} onChange={(event) => onChange(index, event.target.value)} placeholder={`Add ${label.toLowerCase()} item`} />
            {items.length > 1 ? (
              <button className="btn btn-icon" type="button" onClick={() => onRemove(index)} aria-label={`Remove ${label} item`}>
                <X size={14} />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <button className="btn btn-ghost btn-sm" type="button" onClick={onAdd}>
        <Plus size={14} />
        Add item
      </button>
    </div>
  );
}

function ImageField({ label, value, onUrlChange, onFileChange, onPasteFromClipboard }) {
  return (
    <div className="field image-field">
      <label>{label}</label>
      <input value={value} onChange={(event) => onUrlChange(event.target.value)} placeholder="Paste image URL or use file picker" />
      <div className="image-field-actions">
        <label className="btn btn-ghost btn-sm file-trigger">
          <ImageIcon size={14} />
          Upload image
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => onFileChange(event.target.files?.[0])} />
        </label>
        <button className="btn btn-ghost btn-sm" type="button" onClick={onPasteFromClipboard}>
          <ClipboardPaste size={14} />
          {value ? 'Replace from clipboard' : 'Paste image'}
        </button>
      </div>
      {value ? (
        <div className="image-preview">
          <img alt={label} src={value} />
        </div>
      ) : (
        <div className="image-drop-placeholder">
          <ImageIcon size={22} />
          <span>Add a before/after visual here to make the decision card feel complete.</span>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

async function readClipboardImage() {
  try {
    if (!navigator.clipboard?.read) {
      return '';
    }

    const items = await navigator.clipboard.read();
    for (const item of items) {
      const imageType = item.types.find((type) => type.startsWith('image/'));
      if (imageType) {
        const blob = await item.getType(imageType);
        return URL.createObjectURL(blob);
      }
    }
  } catch {
    return '';
  }

  return '';
}

function EmptyState({ title, description, actionLabel, onAction, secondaryActionLabel = '', onSecondaryAction }) {
  return (
    <section className="empty-state panel">
      <div className="empty-illustration" />
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="button-row">
        {actionLabel ? (
          <button className="btn btn-primary" type="button" onClick={onAction}>
            <Plus size={16} />
            {actionLabel}
          </button>
        ) : null}
        {secondaryActionLabel ? (
          <button className="btn btn-secondary" type="button" onClick={onSecondaryAction}>
            <Play size={16} />
            {secondaryActionLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function QuickActionsMenu({ x, y, onEdit, onDelete }) {
  return (
    <div className="quick-actions-menu" style={{ left: x, top: y }} onClick={(event) => event.stopPropagation()}>
      <button className="quick-action-item" type="button" onClick={onEdit}>
        <Pencil size={14} />
        Edit project
      </button>
      <button className="quick-action-item quick-action-danger" type="button" onClick={onDelete}>
        <Trash2 size={14} />
        Delete project
      </button>
    </div>
  );
}

function SectionBlock({ label, body }) {
  return (
    <section className="detail-section">
      <span className="eyebrow">{label}</span>
      <p>{body}</p>
    </section>
  );
}

function ListBlock({ label, items }) {
  return (
    <section className="detail-section">
      <span className="eyebrow">{label}</span>
      <ul className="detail-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default App;
