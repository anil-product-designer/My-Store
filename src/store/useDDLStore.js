import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { seedProjects, seedDecisions } from '../data/seed';
import { getSupabaseClient } from '../lib/supabase';

const uid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const updateProjectTimestamp = (project) => ({
  ...project,
  updatedAt: new Date().toISOString(),
});

export const useDDLStore = create(
  persist(
    (set, get) => ({
      splashComplete: false,
      isLoading: false,
      error: null,
      config: {
        url: '',
        anonKey: '',
        connectedAt: '',
      },
      projects: seedProjects,
      decisions: seedDecisions,

      setSplashComplete: () => set({ splashComplete: true }),

      setConfig: (config) => {
        set({
          config: {
            ...config,
            connectedAt: new Date().toISOString(),
          },
        });
        // After setting config, try to refresh data
        get().init();
      },

      clearConfig: () =>
        set({
          config: {
            url: '',
            anonKey: '',
            connectedAt: '',
          },
          projects: seedProjects,
          decisions: seedDecisions,
        }),

      init: async () => {
        const { config } = get();
        if (!config.url || !config.anonKey || config.url === 'demo-mode') return;

        set({ isLoading: true, error: null });
        const supabase = getSupabaseClient(config);

        try {
          const [{ data: projectsData, error: projectsError }, { data: decisionsData, error: decisionsError }] =
            await Promise.all([
              supabase.from('projects').select('*').order('updated_at', { ascending: false }),
              supabase.from('design_decisions').select('*').order('updated_at', { ascending: false }),
            ]);

          if (projectsError) throw projectsError;
          if (decisionsError) throw decisionsError;

          // Map snake_case from DB to camelCase for the app
          const mappedProjects = (projectsData || []).map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            category: p.category,
            color: p.color,
            createdAt: p.created_at,
            updatedAt: p.updated_at
          }));

          const mappedDecisions = (decisionsData || []).map(d => ({
            id: d.id,
            projectId: d.project_id,
            title: d.title,
            description: d.description,
            rationale: d.rationale,
            advantages: d.advantages,
            disadvantages: d.disadvantages,
            tags: d.tags,
            beforeImageUrl: d.before_image_url,
            afterImageUrl: d.after_image_url,
            status: d.status,
            dateChanged: d.date_changed,
            createdAt: d.created_at,
            updatedAt: d.updated_at
          }));

          set({ 
            projects: mappedProjects.length > 0 ? mappedProjects : seedProjects, 
            decisions: mappedDecisions.length > 0 ? mappedDecisions : seedDecisions,
            isLoading: false 
          });
        } catch (err) {
          console.error('Supabase init error:', err);
          set({ error: err.message, isLoading: false });
        }
      },

      addProject: async (payload) => {
        const newProject = {
          id: payload.id || uid('proj'),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...payload,
        };

        set((state) => ({
          projects: [newProject, ...state.projects],
        }));

        const { config } = get();
        if (config.url && config.anonKey && config.url !== 'demo-mode') {
          const supabase = getSupabaseClient(config);
          await supabase.from('projects').insert([{
            id: newProject.id,
            name: newProject.name,
            description: newProject.description,
            category: newProject.category,
            color: newProject.color
          }]);
        }
      },

      updateProject: async (projectId, payload) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? updateProjectTimestamp({ ...project, ...payload }) : project,
          ),
        }));

        const { config } = get();
        if (config.url && config.anonKey && config.url !== 'demo-mode') {
          const supabase = getSupabaseClient(config);
          await supabase.from('projects').update({
            name: payload.name,
            description: payload.description,
            category: payload.category,
            color: payload.color,
            updated_at: new Date().toISOString()
          }).eq('id', projectId);
        }
      },

      deleteProject: async (projectId) => {
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== projectId),
          decisions: state.decisions.filter((decision) => decision.projectId !== projectId),
        }));

        const { config } = get();
        if (config.url && config.anonKey && config.url !== 'demo-mode') {
          const supabase = getSupabaseClient(config);
          await supabase.from('projects').delete().eq('id', projectId);
        }
      },

      addDecision: async (projectId, payload) => {
        const newDecision = {
          id: uid('dec'),
          projectId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...payload,
        };

        set((state) => ({
          decisions: [newDecision, ...state.decisions],
          projects: state.projects.map((project) =>
            project.id === projectId ? updateProjectTimestamp(project) : project,
          ),
        }));

        const { config } = get();
        if (config.url && config.anonKey && config.url !== 'demo-mode') {
          const supabase = getSupabaseClient(config);
          await supabase.from('design_decisions').insert([{
            id: newDecision.id,
            project_id: projectId,
            title: newDecision.title,
            description: newDecision.description,
            rationale: newDecision.rationale,
            advantages: newDecision.advantages,
            disadvantages: newDecision.disadvantages,
            tags: newDecision.tags,
            before_image_url: newDecision.beforeImageUrl,
            after_image_url: newDecision.afterImageUrl,
            status: newDecision.status,
            date_changed: newDecision.dateChanged
          }]);
        }
      },

      updateDecision: async (decisionId, payload) => {
        let existingProjectId = null;
        
        set((state) => {
          const existing = state.decisions.find((decision) => decision.id === decisionId);
          existingProjectId = existing?.projectId;
          return {
            decisions: state.decisions.map((decision) =>
              decision.id === decisionId
                ? {
                    ...decision,
                    ...payload,
                    updatedAt: new Date().toISOString(),
                  }
                : decision,
            ),
            projects: existing
              ? state.projects.map((project) =>
                  project.id === existing.projectId ? updateProjectTimestamp(project) : project,
                )
              : state.projects,
          };
        });

        const { config } = get();
        if (config.url && config.anonKey && config.url !== 'demo-mode' && decisionId) {
          const supabase = getSupabaseClient(config);
          await supabase.from('design_decisions').update({
            title: payload.title,
            description: payload.description,
            rationale: payload.rationale,
            advantages: payload.advantages,
            disadvantages: payload.disadvantages,
            tags: payload.tags,
            before_image_url: payload.beforeImageUrl,
            after_image_url: payload.afterImageUrl,
            status: payload.status,
            date_changed: payload.dateChanged,
            updated_at: new Date().toISOString()
          }).eq('id', decisionId);
        }
      },

      deleteDecision: async (decisionId) => {
        set((state) => {
          const existing = state.decisions.find((decision) => decision.id === decisionId);
          return {
            decisions: state.decisions.filter((decision) => decision.id !== decisionId),
            projects: existing
              ? state.projects.map((project) =>
                  project.id === existing.projectId ? updateProjectTimestamp(project) : project,
                )
              : state.projects,
          };
        });

        const { config } = get();
        if (config.url && config.anonKey && config.url !== 'demo-mode') {
          const supabase = getSupabaseClient(config);
          await supabase.from('design_decisions').delete().eq('id', decisionId);
        }
      },

      getProjectById: (projectId) => get().projects.find((project) => project.id === projectId),
      getDecisionById: (decisionId) => get().decisions.find((decision) => decision.id === decisionId),
    }),
    {
      name: 'ddl-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
