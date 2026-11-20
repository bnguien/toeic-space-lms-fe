import { useCurrentUser, RequireAuth, PORTAL_HOME } from "@/modules/auth";

import { Navigate } from "react-router-dom";
import "@/styles/globals.css";

function App() {
  const user = useCurrentUser();
  return (
    <RequireAuth>
      <Navigate to={user ? PORTAL_HOME[user.role] : "/login"} replace />
    </RequireAuth>
  );
}

export default App;
