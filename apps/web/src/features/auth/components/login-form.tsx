import type { SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useLogin } from "@/features/auth/hooks/use-login";
import { useLoginForm } from "@/features/auth/hooks/use-login-form";
import type { LoginFormData } from "@/features/auth/types";

/**
 * Formulário responsável apenas pela interface e pela orquestração do login.
 *
 * A regra de validação fica no schema (login.schema.ts), a configuração do
 * React Hook Form fica em useLoginForm e a chamada HTTP fica em useLogin.
 * Separar essas responsabilidades deixa o componente mais fácil de entender
 * e permite reutilizar a mesma lógica em outros lugares, se necessário.
 */
export function LoginForm() {
  const form = useLoginForm();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  /**
   * `handleSubmit` chama esta função somente depois que o resolver do Zod
   * valida os campos. Por isso, `data` já chega com o formato de
   * LoginFormData e não precisamos validar email/senha manualmente aqui.
   */
  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    try {
      // `mutateAsync` permite aguardar a conclusão da requisição dentro do
      // submit. Assim, o React Hook Form mantém `isSubmitting` correto.
      await loginMutation.mutateAsync(data);
    } catch {
      // A mutation já registra o erro em `isError`. Capturamos a exceção para
      // evitar uma Promise rejeitada não tratada no evento de submit.
    }
  };

  const isLoading = isSubmitting || loginMutation.isPending;

  return (
    <form
      className="w-full max-w-md space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-2xl shadow-black/10 sm:p-8"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
        <p className="text-sm text-muted-foreground">
          Acesse sua conta para continuar no DevLog.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            E-mail
          </label>
          <input
            {...register("email")}
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={errors.email ? "true" : "false"}
            autoComplete="email"
            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
            id="email"
            placeholder="voce@exemplo.com"
            type="email"
          />
          {errors.email ? (
            <p className="text-sm text-destructive" id="email-error" role="alert">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">
            Senha
          </label>
          <input
            {...register("password")}
            aria-describedby={errors.password ? "password-error" : undefined}
            aria-invalid={errors.password ? "true" : "false"}
            autoComplete="current-password"
            className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
            id="password"
            placeholder="Digite sua senha"
            type="password"
          />
          {errors.password ? (
            <p className="text-sm text-destructive" id="password-error" role="alert">
              {errors.password.message}
            </p>
          ) : null}
        </div>
      </div>

      {loginMutation.isError ? (
        <p className="text-sm text-destructive" role="alert">
          Não foi possível entrar. Verifique seu e-mail e sua senha e tente novamente.
        </p>
      ) : null}

      <Button className="w-full" disabled={isLoading} size="lg" type="submit">
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
