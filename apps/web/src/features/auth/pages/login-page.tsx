import { Link } from "react-router";
import { LoginForm } from "@/features/auth/components/login-form";

/**
 * Página responsável pelo contexto visual do login.
 *
 * O LoginForm continua responsável pelos campos, validação e envio dos dados.
 * A página apenas compõe esse formulário com a identidade do DevLog e um
 * layout centralizado, mantendo cada componente com uma responsabilidade
 * pequena e fácil de testar.
 */
export default function LoginPage() {
  return (
    <main className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-background px-6 py-12 sm:px-8">
      {/*
       * Elementos decorativos ficam fora do fluxo e são ignorados por leitores
       * de tela. Assim, a aparência da página não interfere na navegação por
       * teclado nem na leitura do formulário.
       */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 -top-48 size-128 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-48 -bottom-48 size-128 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="flex w-full max-w-md flex-col items-center gap-8">
        {/*
         * Linkar a marca para a página inicial oferece uma saída clara para
         * quem chegou ao login por engano, sem criar uma nova regra de
         * navegação dentro do formulário.
         */}
        <Link
          aria-label="Ir para a página inicial do DevLog"
          className="inline-flex items-center tracking-tight"
          to="/"
        >
          <img
            alt="DevLog"
            className="h-20 w-auto object-contain"
            src="/logo_horizontal.png"
          />
        </Link>

        <LoginForm />
      </div>
    </main>
  );
}
