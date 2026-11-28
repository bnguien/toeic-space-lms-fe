import { httpClient } from "@/services/http";
import type { ClassroomWorkspace, StudentPortalOverview } from "../types/student-workspace.types";

const base = "/classroom/api/v1";

export const studentWorkspaceApi = {
  getOverview: async (daysAhead: number, signal: AbortSignal) =>
    (
      await httpClient.get<StudentPortalOverview>(`${base}/students/me/workspace`, {
        params: { daysAhead },
        signal,
      })
    ).data,

  getClassroomWorkspace: async (classId: string, signal: AbortSignal) =>
    (
      await httpClient.get<ClassroomWorkspace>(
        `${base}/classes/me/enrolled/${classId}/workspace`,
        { signal },
      )
    ).data,
};
