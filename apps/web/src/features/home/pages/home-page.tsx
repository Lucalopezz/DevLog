import { BookOpenText, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/date";

function HomePage() {
  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-18rem] size-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-16rem] right-[-12rem] size-[32rem] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-svh w-full max-w-4xl flex-col justify-center gap-10 px-6 py-16 sm:px-8">
        <header className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-sm text-muted-foreground backdrop-blur">
            <BookOpenText className="size-4 text-primary" />
            DevLog
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
              Base do frontend pronta
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Rotas, dados remotos, formulários, interface e conteúdo técnico já
              têm uma base consistente para as próximas funcionalidades.
            </p>
          </div>
        </header>

        <section className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-2xl shadow-black/20 backdrop-blur sm:p-8">
          <div className="mb-5 flex items-center gap-3 font-medium">
            <span className="flex size-9 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="size-5 text-emerald-400" />
            </span>
            <span>Configuração inicial</span>
          </div>
          <Markdown className="text-card-foreground/80">
            {`- Use \`api\` para chamadas HTTP com cookies de autenticação.
- Use React Query para leituras e mutações da API.
- Use \`useLoginForm\` como referência para novos formulários Zod + Hook Form.`}
          </Markdown>
        </section>

        <div className="flex flex-wrap items-center gap-4">
          <Button
            className="shadow-lg shadow-primary/10"
            size="lg"
            onClick={() => toast.success("Sonner está configurado!")}
          >
            <Sparkles data-icon="inline-start" />
            Testar notificação
          </Button>
          <span className="text-sm text-muted-foreground">
            Configurado {formatRelativeDate(new Date())}
          </span>
        </div>
      </div>
    </main>
  );
}

export default HomePage;
