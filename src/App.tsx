import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/AppShell";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Store from "./pages/Store";
import Tools from "./pages/Tools";
import ToolPage from "./pages/ToolPage";
import History from "./pages/History";
import NotFound from "./pages/NotFound";
import { DiscordButton } from "./components/DiscordButton";
import AdminLogin from "./pages/admin/AdminLogin";
import { AdminGuard } from "./pages/admin/AdminGuard";
import { AdminShell } from "./pages/admin/AdminShell";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTools from "./pages/admin/AdminTools";
import AdminCredits from "./pages/admin/AdminCredits";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected app */}
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat/:id" element={<Chat />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/tools/:id" element={<ToolPage />} />
              <Route path="/store" element={<Store />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route element={<AdminGuard><AdminShell /></AdminGuard>}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/tools" element={<AdminTools />} />
              <Route path="/admin/credits" element={<AdminCredits />} />
              <Route path="/admin/announcements" element={<AdminAnnouncements />} />
              <Route path="/admin/logs" element={<AdminLogs />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>

            {/* Legacy redirects */}
            <Route path="/splash" element={<Navigate to="/" replace />} />
            <Route path="/verify" element={<Navigate to="/signin" replace />} />
            <Route path="/success" element={<Navigate to="/chat" replace />} />
            <Route path="/code" element={<Navigate to="/chat" replace />} />
            <Route path="/empty" element={<Navigate to="/chat" replace />} />
            <Route path="/upload" element={<Navigate to="/chat" replace />} />
            <Route path="/sidebar" element={<Navigate to="/chat" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <DiscordButton />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
