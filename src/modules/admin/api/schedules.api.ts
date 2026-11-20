import { httpClient } from "@/services/http";
import type { StudentConflictPreview } from "@/shared/types/student-conflicts.types";
import type {
  CancelRangeRequest,
  ClassSchedule,
  GenerateSessionsInput,
  ScheduleAuditView,
  ScheduleInput,
  SessionOperationResult,
} from "../types/schedule.types";

const base = (classId: string) => `/classroom/api/v1/classes/${classId}/schedules`;

const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
type ScheduleResponse = Omit<ClassSchedule, "daysOfWeek"> & {
  daysOfWeek: (number | (typeof weekdays)[number])[];
};

function normalizeSchedule(schedule: ScheduleResponse): ClassSchedule {
  return {
    ...schedule,
    daysOfWeek: schedule.daysOfWeek.map((day) =>
      typeof day === "number" ? day : weekdays.indexOf(day),
    ),
  };
}

export const schedulesApi = {
  list: async (classId: string, signal?: AbortSignal) =>
    (await httpClient.get<ScheduleResponse[]>(base(classId), { signal })).data.map(
      normalizeSchedule,
    ),

  get: async (classId: string, id: string, signal?: AbortSignal) =>
    normalizeSchedule(
      (await httpClient.get<ScheduleResponse>(`${base(classId)}/${id}`, { signal })).data,
    ),

  create: async (classId: string, input: ScheduleInput) =>
    normalizeSchedule((await httpClient.post<ScheduleResponse>(base(classId), input)).data),

  previewCreate: async (classId: string, input: ScheduleInput) =>
    (await httpClient.post<StudentConflictPreview>(`${base(classId)}/conflicts/preview`, input))
      .data,

  update: async (classId: string, id: string, input: ScheduleInput, expectedVersion: number) => {
    const { data } = await httpClient.put<{
      schedule: ScheduleResponse;
      sessions: SessionOperationResult;
    }>(`${base(classId)}/${id}`, { input, expectedVersion });
    return { ...data, schedule: normalizeSchedule(data.schedule) };
  },

  previewUpdate: async (
    classId: string,
    id: string,
    input: ScheduleInput,
    expectedVersion: number,
  ) =>
    (
      await httpClient.post<StudentConflictPreview>(`${base(classId)}/${id}/conflicts/preview`, {
        input,
        expectedVersion,
      })
    ).data,

  audit: async (classId: string, id: string, signal?: AbortSignal) =>
    (await httpClient.get<ScheduleAuditView[]>(`${base(classId)}/${id}/audit`, { signal })).data,

  generate: async (classId: string, payload: GenerateSessionsInput) =>
    (await httpClient.post<SessionOperationResult>(`${base(classId)}/generate`, payload)).data,

  previewGenerate: async (classId: string, payload: GenerateSessionsInput) =>
    (
      await httpClient.post<StudentConflictPreview>(
        `${base(classId)}/generate/conflicts/preview`,
        payload,
      )
    ).data,

  bulkCancel: async (classId: string, payload: CancelRangeRequest) =>
    (await httpClient.post<SessionOperationResult>(`${base(classId)}/cancel-sessions`, payload))
      .data,
};
