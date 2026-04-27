import { Link } from "react-router-dom";
import { Zap, Star } from "lucide-react";
import { TOOLS } from "@/lib/tools";

export default function Tools() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-10 space-y-6">
        <header>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">All <span className="text-primary">Tools</span></h1>
          <p className="text-sm text-muted-foreground mt-1">Browse every Fluxa AI tool in one place.</p>
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {TOOLS.map((t) => (
            <Link
              key={t.id}
              to={`/tools/${t.id}`}
              className="text-left rounded-2xl bg-card border border-border p-3 hover:border-primary/40 transition-colors block"
            >
              <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${t.color} border flex items-center justify-center mb-3`}>
                <t.icon className="h-6 w-6" />
              </div>
              <div className="text-sm font-semibold leading-tight">{t.name}</div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{t.desc}</p>
              <div className="flex items-center justify-between mt-3 text-xs">
                <span className="inline-flex items-center gap-1 text-primary"><Zap className="h-3.5 w-3.5 fill-primary" />{t.credits}</span>
                <span className="inline-flex items-center gap-1 text-yellow-400"><Star className="h-3.5 w-3.5 fill-yellow-400" />{t.rating}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
