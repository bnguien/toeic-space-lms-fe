// Only authenticated LMS screens appropriate for this recipient can be opened from a notice.
export function destination(
  type: string,
  path: string | null,
  role: string,
  relatedId?: string | null,
) {
  const id = relatedId && /^[\w-]+$/.test(relatedId) ? relatedId : null;
  const student = role === "User";
  const teacher = role === "Teacher";
  const classes = student ? "/my-classes" : teacher ? "/teacher/classes" : null;
  switch (type) {
    case "StudentWithdrawn":
    case "TeacherUnassigned":
      return classes;
    case "StudentEnrolled":
    case "TeacherAssigned":
    case "StudentsJoined":
    case "ClassTeacherChanged":
    case "ClassStarted":
    case "ClassCompleted":
    case "ClassUpdated":
      if (!classes || !id) return classes;
      return student ? `${classes}/${id}` : `${classes}?class=${id}`;
    case "SessionAdded":
    case "SessionUpdated":
    case "SessionCancelled":
    case "MeetChanged":
      if (student && id) return `/my-classes/sessions/${id}`;
      if (teacher && id) return `/teacher/schedule?session=${id}`;
      return student ? "/my-classes?tab=calendar" : teacher ? "/teacher/schedule" : null;
    case "ScheduleCreated":
      return student ? "/my-classes?tab=calendar" : teacher ? "/teacher/schedule" : null;
    case "AttendanceAbsent":
    case "AttendanceAdjusted":
      return student ? "/my-classes?tab=attendance" : null;
    case "ActiveAccountCreated":
    case "AccountActivated":
    case "AccountSuspended":
    case "AccountUnlocked":
    case "PasswordChanged":
    case "RoleChanged":
      return teacher ? "/teacher/settings" : "/profile";
    case "TuitionCreated":
    case "TuitionPaymentRecorded":
    case "TuitionWaived":
      return student && id ? `/tuition/${id}` : null;
    case "ReconciliationRequired":
      return role === "Admin" ? "/admin/tuition/statements" : null;
  }
  if (
    type !== "ExamAttemptScored" ||
    !path ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    /[\\%\s]/.test(path)
  )
    return null;
  const allowed: Record<string, RegExp> = {
    User: /^\/my-classes(?:\/[\w-]+)?$/,
    Teacher: /^\/teacher(?:\/classes|\/schedule)?$/,
    Admin: /^\/admin(?:\/exams|\/exams\/list)?$/,
  };
  return allowed[role]?.test(path) ? path : null;
}
