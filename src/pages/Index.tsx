import { Link } from "react-router-dom";
import { FluxaWordmark } from "@/components/FluxaWordmark";
import Splash from "./Splash";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import ForgotPassword from "./ForgotPassword";
import VerifyEmail from "./VerifyEmail";
import AccountCreated from "./AccountCreated";
import Chat from "./Chat";
import CodeChat from "./CodeChat";
import EmptyChat from "./EmptyChat";
import UploadSheet from "./UploadSheet";
import PopularTools from "./PopularTools";
import Settings from "./Settings";
import Sidebar from "./Sidebar";

// Embedded preview wrapper — strips outer min-h/padding by reusing
// the screen markup directly inside a smaller container.
const Tile = ({ to, label, children }: any) => (
  <Link to={to} className="group flex flex-col items-center gap-3">
    <div className="origin-top scale-[0.78] -mb-[180px]">{children}</div>
    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
  </Link>
);

const Index = () => {
  return (
    <main className="min-h-screen w-full" style={{ background: "var(--page-bg)" }}>
      <header className="pt-12 pb-2 text-center">
        <FluxaWordmark />
        <p className="mt-2 text-sm text-muted-foreground">Smart AI Assistant for Everything</p>
      </header>

      <section className="px-6 pt-6 pb-20 max-w-[1400px] mx-auto">
        <h1 className="sr-only">Fluxa AI mobile app screens</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-12 justify-items-center">
          <Tile to="/splash" label="Splash"><Splash /></Tile>
          <Tile to="/signin" label="Sign In"><SignIn /></Tile>
          <Tile to="/signup" label="Create Account"><SignUp /></Tile>
          <Tile to="/forgot" label="Forgot Password"><ForgotPassword /></Tile>
          <Tile to="/verify" label="Verify Email"><VerifyEmail /></Tile>
          <Tile to="/success" label="Account Created"><AccountCreated /></Tile>
          <Tile to="/chat" label="Chat"><Chat /></Tile>
          <Tile to="/code" label="Code Chat"><CodeChat /></Tile>
          <Tile to="/empty" label="Empty Chat"><EmptyChat /></Tile>
          <Tile to="/upload" label="Upload Sheet"><UploadSheet /></Tile>
          <Tile to="/tools" label="Popular Tools"><PopularTools /></Tile>
          <Tile to="/settings" label="Settings"><Settings /></Tile>
          <Tile to="/sidebar" label="Sidebar"><Sidebar /></Tile>
        </div>
      </section>
    </main>
  );
};

export default Index;
