import type { SubmitHandler } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { FormInput } from '@/components/ui/form-input'
import { useLogin } from '@/features/auth/hooks/use-login'
import { useLoginForm } from '@/features/auth/hooks/use-login-form'
import type { LoginFormData } from '@/features/auth/types'

/**
 * Formulário responsável apenas pela interface e pela orquestração do login.
 *
 * A regra de validação fica no schema (login.schema.ts), a configuração do
 * React Hook Form fica em useLoginForm e a chamada HTTP fica em useLogin.
 * Separar essas responsabilidades deixa o componente mais fácil de entender
 * e permite reutilizar a mesma lógica em outros lugares, se necessário.
 */
export function LoginForm() {
  const form = useLoginForm()
  const loginMutation = useLogin()

  const { handleSubmit } = form

  /**
   * `handleSubmit` chama esta função somente depois que o resolver do Zod
   * valida os campos. Por isso, `data` já chega com o formato de
   * LoginFormData e não precisamos validar email/senha manualmente aqui.
   */
  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    try {
      // `mutateAsync` permite aguardar a conclusão da requisição dentro do
      // submit. Assim, o React Hook Form mantém `isSubmitting` correto.
      await loginMutation.mutateAsync(data)
    } catch {
      // A mutation já registra o erro em `isError`. Capturamos a exceção para
      // evitar uma Promise rejeitada não tratada no evento de submit.
    }
  }

  const isLoading = form.formState.isSubmitting || loginMutation.isPending

  return (
    <Form {...form}>
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
          <FormInput
            autoComplete="email"
            control={form.control}
            label="E-mail"
            name="email"
            placeholder="voce@exemplo.com"
            type="email"
          />
          <FormInput
            autoComplete="current-password"
            control={form.control}
            label="Senha"
            name="password"
            placeholder="Digite sua senha"
            type="password"
          />
        </div>

        {loginMutation.isError ? (
          <p className="text-sm text-destructive" role="alert">
            Não foi possível entrar. Verifique seu e-mail e sua senha e tente novamente.
          </p>
        ) : null}

        <Button className="w-full" disabled={isLoading} size="lg" type="submit">
          {isLoading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </Form>
  )
}
