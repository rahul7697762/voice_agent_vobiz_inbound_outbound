import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./lib/auth";
import { MainLayout } from "./components/layout/MainLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import AgentSettings from "./pages/settings/AgentSettings";
import ModelSettings from "./pages/settings/ModelSettings";
import ApiCredentials from "./pages/settings/ApiCredentials";
import CallLogs from "./pages/CallLogs";
import CrmContacts from "./pages/CrmContacts";
import PhoneNumbers from "./pages/PhoneNumbers";
import UserDashboard from "./pages/UserDashboard";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected */}
          <Route
            path="/userdashboard"
            element={<ProtectedRoute><UserDashboard /></ProtectedRoute>}
          />
          <Route
            path="/"
            element={<ProtectedRoute><MainLayout /></ProtectedRoute>}
          >
            <Route index element={<Dashboard />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="settings/agent" element={<AgentSettings />} />
            <Route path="settings/models" element={<ModelSettings />} />
            <Route path="settings/credentials" element={<ApiCredentials />} />
            <Route path="logs" element={<CallLogs />} />
            <Route path="crm" element={<CrmContacts />} />
            <Route path="phone-numbers" element={<PhoneNumbers />} />
          </Route>
        </Routes>
        <Toaster theme="light" position="bottom-right" />
      </Router>
    </AuthProvider>
  );
}

export default App;
