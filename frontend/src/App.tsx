import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import AgentSettings from "./pages/settings/AgentSettings";
import ModelSettings from "./pages/settings/ModelSettings";
import ApiCredentials from "./pages/settings/ApiCredentials";
import CallLogs from "./pages/CallLogs";
import CrmContacts from "./pages/CrmContacts";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="settings/agent" element={<AgentSettings />} />
          <Route path="settings/models" element={<ModelSettings />} />
          <Route path="settings/credentials" element={<ApiCredentials />} />
          <Route path="logs" element={<CallLogs />} />
          <Route path="crm" element={<CrmContacts />} />
        </Route>
      </Routes>
      <Toaster theme="dark" position="bottom-right" />
    </Router>
  );
}

export default App;
