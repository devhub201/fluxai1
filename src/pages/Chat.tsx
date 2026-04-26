import { Phone } from "@/components/Phone";
import { ChatLayout } from "@/components/Chat";
import logo from "@/assets/fluxa-logo.png";

const Chat = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <Phone>
      <ChatLayout>
        <div className="px-4 py-4 space-y-4 overflow-y-auto h-full">
          {/* user bubble */}
          <div className="flex justify-end">
            <div className="max-w-[80%]">
              <div className="rounded-2xl rounded-tr-sm bg-primary/15 border border-primary/30 px-3 py-2 text-sm text-foreground">
                Bhai mujhe ek responsive portfolio website bana ke de
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground text-right">11:30 AM</div>
            </div>
          </div>

          {/* assistant */}
          <div className="flex items-start gap-2">
            <img src={logo} alt="" width={24} height={24} className="h-6 w-6 rounded-full" />
            <div className="max-w-[85%]">
              <div className="text-xs text-muted-foreground mb-1">Fluxa AI</div>
              <div className="rounded-2xl rounded-tl-sm bg-surface-2 border border-border px-3 py-2 text-sm text-foreground">
                Sure! 🚀 Main tumhare liye ek modern aur responsive portfolio website bana deta hun.
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Yeh rahi complete code:</div>

              {/* code card */}
              <div className="mt-2 rounded-xl bg-[#0a0e14] border border-border overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border text-xs">
                  <span className="text-muted-foreground">index.html</span>
                  <button className="text-primary font-medium flex items-center gap-1">
                    <span>📋</span> Copy
                  </button>
                </div>
                <pre className="px-3 py-2 text-[11px] leading-relaxed text-foreground/90 font-mono overflow-x-auto">
{`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-w
  <title>My Portfolio</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <header>
    <div class="logo">MyPortfolio</div>
    <nav>
      <a href="#home">Home</a>
      <a href="#about">About</a>`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </ChatLayout>
    </Phone>
  </div>
);

export default Chat;
