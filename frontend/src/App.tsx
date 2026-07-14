import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import CreateInterviewPage from "./pages/CreateInterviewPage";
import InterviewDetailsPage from "./pages/InterviewDetailsPage";
import InterviewSessionPage from "./pages/InterviewSessionPage";
import ProgressPage from "./pages/ProgressPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<ProgressPage />} />
          <Route path="/interviews/new" element={<CreateInterviewPage />} />
          <Route path="/interviews/:id" element={<InterviewDetailsPage />} />
          <Route path="/interviews/:id/session" element={<InterviewSessionPage />} />
          <Route path="/interviews" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
