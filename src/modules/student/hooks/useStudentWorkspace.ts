import { useQuery } from "@tanstack/react-query";
import { studentWorkspaceApi } from "../api/student-workspace.api";

const DAYS_AHEAD = 14;

const keys = {
  overview: (daysAhead: number) => ["student", "workspace", "overview", daysAhead] as const,
  classroom: (classId: string) => ["student", "workspace", "classroom", classId] as const,
};

export const useStudentPortalOverview = () =>
  useQuery({
    queryKey: keys.overview(DAYS_AHEAD),
    queryFn: ({ signal }) => studentWorkspaceApi.getOverview(DAYS_AHEAD, signal),
    retry: false,
  });

export const useClassroomWorkspace = (classId: string | undefined) =>
  useQuery({
    queryKey: keys.classroom(classId ?? ""),
    queryFn: ({ signal }) => studentWorkspaceApi.getClassroomWorkspace(classId!, signal),
    enabled: Boolean(classId),
    retry: false,
  });
