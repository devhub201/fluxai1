import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Splash from "./pages/Splash.tsx";
import SignIn from "./pages/SignIn.tsx";
import SignUp from "./pages/SignUp.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import VerifyEmail from "./pages/VerifyEmail.tsx";
import AccountCreated from "./pages/AccountCreated.tsx";
import Chat from "./pages/Chat.tsx";
import CodeChat from "./pages/CodeChat.tsx";
import EmptyChat from "./pages/EmptyChat.tsx";
import UploadSheet from "./pages/UploadSheet.tsx";
import PopularTools from "./pages/PopularTools.tsx";
import Settings from "./pages/Settings.tsx";
import Sidebar from "./pages/Sidebar.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/splash" element={<Splash />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/success" element={<AccountCreated />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/code" element={<CodeChat />} />
          <Route path="/empty" element={<EmptyChat />} />
          <Route path="/upload" element={<UploadSheet />} />
          <Route path="/tools" element={<PopularTools />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/sidebar" element={<Sidebar />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
