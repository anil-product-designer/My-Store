import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { seedProjects, seedDecisions } from '../data/seed';

const uid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const updateProjectTimestamp = (project) => ({
  ...project,
  updatedAt: new Date().toISOString(),
});

export const useDDLStore = create(
  persist(
    (set, get) => ({
      splashComplete: false,
      config: {
        url: '',
        anonKey: '',
        connectedAt: '',
      },
      projects: seedProjects,
      decisions: seedDecisions,
      setSplashComplete: () => set({ splashComplete: true }),
      setConfig: (config) =>
        set({
          config: {
            ...config,
            connectedAt: new Date().toISOString(),
          },
        }),
      clearConfig: () =>
        set({
          config: {
            url: '',
            anonKey: '',
            connectedAt: '',
          },
        }),
      addProject: (payload) =>
        set((state) => ({
          projects: [
            {
              id: payload.id || uid('proj'),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              ...payload,
            },
            ...state.projects,
          ],
        })),
      updateProject: (projectId, payload) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? updateProjectTimestamp({ ...project, ...payload }) : project,
          ),
        })),
      deleteProject: (projectId) =>
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== projectId),
          decisions: state.decisions.filter((decision) => decision.projectId !== projectId),
        })),
      addDecision: (projectId, payload) =>
        set((state) => ({
          decisions: [
            {
              id: uid('dec'),
              projectId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              ...payload,
            },
            ...state.decisions,
          ],
          projects: state.projects.map((project) =>
            project.id === projectId ? updateProjectTimestamp(project) : project,
          ),
        })),
      updateDecision: (decisionId, payload) =>
        set((state) => {
          const existing = state.decisions.find((decision) => decision.id === decisionId);
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
        }),
      deleteDecision: (decisionId) =>
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
        }),
      getProjectById: (projectId) => get().projects.find((project) => project.id === projectId),
      getDecisionById: (decisionId) => get().decisions.find((decision) => decision.id === decisionId),
    }),
    {
      name: 'ddl-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
