import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { seedProjects, seedDecisions } from '../data/seed';
import { getSupabaseClient, uploadImageToStorage, deleteImageFromStorage } from '../lib/supabase';

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
        let { config } = get();

        // Fallback to Env Config if local storage config is empty (vital for /share routes)
        if (!config.url || !config.anonKey) {
          const envUrl = import.meta.env.VITE_SUPABASE_URL;
          const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
          
          if (envUrl && envKey) {
            config = { url: envUrl, anonKey: envKey, connectedAt: new Date().toISOString() };
            set({ config });
          }
        }

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
        const decisionId = uid('dec');
        const { config } = get();
        
        let finalBeforeUrl = payload.beforeImageUrl;
        let finalAfterUrl = payload.afterImageUrl;

        if (config.url && config.anonKey && config.url !== 'demo-mode') {
          const supabase = getSupabaseClient(config);
          
          if (payload.beforeImageUrlFile) {
            finalBeforeUrl = await uploadImageToStorage(supabase, payload.beforeImageUrlFile, projectId, decisionId, 'before') || finalBeforeUrl;
          }
          if (payload.afterImageUrlFile) {
            finalAfterUrl = await uploadImageToStorage(supabase, payload.afterImageUrlFile, projectId, decisionId, 'after') || finalAfterUrl;
          }
        }

        const newDecision = {
          ...payload,
          id: decisionId,
          projectId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          beforeImageUrl: finalBeforeUrl,
          afterImageUrl: finalAfterUrl,
        };

        // remove file references from the stored state
        delete newDecision.beforeImageUrlFile;
        delete newDecision.afterImageUrlFile;

        set((state) => ({
          decisions: [newDecision, ...state.decisions],
          projects: state.projects.map((project) =>
            project.id === projectId ? updateProjectTimestamp(project) : project,
          ),
        }));

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
        let oldBeforeUrl = null;
        let oldAfterUrl = null;
        const { config } = get();

        // 1. Get existing to know projectId and existing URLs
        set((state) => {
          const existing = state.decisions.find((decision) => decision.id === decisionId);
          existingProjectId = existing?.projectId;
          oldBeforeUrl = existing?.beforeImageUrl;
          oldAfterUrl = existing?.afterImageUrl;
          return state; // No state change yet
        });

        let finalBeforeUrl = payload.beforeImageUrl;
        let finalAfterUrl = payload.afterImageUrl;

        if (config.url && config.anonKey && config.url !== 'demo-mode' && decisionId && existingProjectId) {
          const supabase = getSupabaseClient(config);
          
          if (payload.beforeImageUrlFile) {
            finalBeforeUrl = await uploadImageToStorage(supabase, payload.beforeImageUrlFile, existingProjectId, decisionId, 'before') || finalBeforeUrl;
            if (oldBeforeUrl && oldBeforeUrl.includes('/design-images/')) await deleteImageFromStorage(supabase, oldBeforeUrl);
          }
          else if (payload.beforeImageUrl !== oldBeforeUrl && oldBeforeUrl?.includes('/design-images/')) {
            // Replaced by URL or deleted
            await deleteImageFromStorage(supabase, oldBeforeUrl);
          }

          if (payload.afterImageUrlFile) {
            finalAfterUrl = await uploadImageToStorage(supabase, payload.afterImageUrlFile, existingProjectId, decisionId, 'after') || finalAfterUrl;
            if (oldAfterUrl && oldAfterUrl.includes('/design-images/')) await deleteImageFromStorage(supabase, oldAfterUrl);
          }
          else if (payload.afterImageUrl !== oldAfterUrl && oldAfterUrl?.includes('/design-images/')) {
            await deleteImageFromStorage(supabase, oldAfterUrl);
          }
        }

        const finalPayload = {
          ...payload,
          beforeImageUrl: finalBeforeUrl,
          afterImageUrl: finalAfterUrl,
        };
        delete finalPayload.beforeImageUrlFile;
        delete finalPayload.afterImageUrlFile;

        set((state) => {
          return {
            decisions: state.decisions.map((decision) =>
              decision.id === decisionId
                ? {
                    ...decision,
                    ...finalPayload,
                    updatedAt: new Date().toISOString(),
                  }
                : decision,
            ),
            projects: existingProjectId
              ? state.projects.map((project) =>
                  project.id === existingProjectId ? updateProjectTimestamp(project) : project,
                )
              : state.projects,
          };
        });

        if (config.url && config.anonKey && config.url !== 'demo-mode' && decisionId) {
          const supabase = getSupabaseClient(config);
          await supabase.from('design_decisions').update({
            title: finalPayload.title,
            description: finalPayload.description,
            rationale: finalPayload.rationale,
            advantages: finalPayload.advantages,
            disadvantages: finalPayload.disadvantages,
            tags: finalPayload.tags,
            before_image_url: finalPayload.beforeImageUrl,
            after_image_url: finalPayload.afterImageUrl,
            status: finalPayload.status,
            date_changed: finalPayload.dateChanged,
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
