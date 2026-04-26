import { Phone } from "@/components/Phone";
import { ChatLayout } from "@/components/Chat";
import logo from "@/assets/fluxa-logo.png";

const CodeChat = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <Phone>
      <ChatLayout>
        <div className="px-4 py-4 space-y-3 overflow-y-auto h-full">
          <div className="flex items-start gap-2">
            <img src={logo} alt="" width={24} height={24} className="h-6 w-6 rounded-full" />
            <div className="max-w-[88%]">
              <div className="rounded-2xl rounded-tl-sm bg-surface-2 border border-border px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground/90 overflow-x-auto">
                <Code line={`<a href="#skills">Skills</a>`} />
                <Code line={`<a href="#contact">Contact</a>`} />
                <Code line={`</nav>`} />
                <Code line={`</header>`} />
                <Code line={`<section id="home" class="hero">`} />
                <Code line={`  <div class="content">`} />
                <Code line={`    <h1>Hello, I'm <span>Cube X</span></h1>`} />
                <Code line={`    <p>Full Stack Developer | AI Enthusiast</p>`} />
                <Code line={`    <a href="#contact" class="btn">Hire Me</a>`} />
                <Code line={`  </div>`} />
                <Code line={`</section>`} />
                <Code line={`</body>`} />
                <Code line={`</html>`} />
              </div>
              <div className="mt-2 text-xs text-foreground">
                Agar tu chahe to main isme aur features<br />bhi add kar deta hun.
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">11:30 AM</div>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="max-w-[80%]">
              <div className="rounded-2xl rounded-tr-sm bg-primary/15 border border-primary/30 px-3 py-2 text-sm text-foreground">
                Haan bhai aur achha bana ke de with dark mode and animation
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground text-right">11:32 AM</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <img src={logo} alt="" width={24} height={24} className="h-6 w-6 rounded-full" />
            <div className="rounded-full bg-surface-2 border border-border px-3 py-1.5 text-xs text-muted-foreground">
              Fluxa AI is typing <span className="text-primary">●●●</span>
            </div>
          </div>
        </div>
      </ChatLayout>
    </Phone>
  </div>
);

const Code = ({ line }: { line: string }) => (
  <div><span className="text-muted-foreground/60">&lt;</span>{line.replace(/[<>]/g, '')}<span className="text-muted-foreground/60">&gt;</span></div>
);

export default CodeChat;
