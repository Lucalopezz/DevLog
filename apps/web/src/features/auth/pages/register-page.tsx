import { zodResolver } from '@hookform/resolvers/zod'
import type { SubmitHandler } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { FormInput } from '@/components/ui/form-input'
import { useRegister } from '@/features/auth/hooks/use-register'
import { registerSchema } from '@/features/auth/register.schema'
import type { RegisterFormData } from '@/features/auth/types'

export default function RegisterPage() {
  const registerMutation = useRegister()
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    try {
      await registerMutation.mutateAsync(data)
    } catch {
      // O estado de erro continua disponível em registerMutation para a UI.
    }
  }

  const isLoading = form.formState.isSubmitting || registerMutation.isPending

  return (
    <section className="mx-auto w-full max-w-md space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Criar conta</h1>
        <p className="text-sm text-muted-foreground">
          Crie seu usuário para começar a registrar seus aprendizados.
        </p>
      </header>

      <Form {...form}>
        <form
          className="space-y-5 rounded-2xl border bg-card p-6"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormInput
            autoComplete="name"
            control={form.control}
            label="Nome"
            name="name"
          />
          <FormInput
            autoComplete="email"
            control={form.control}
            label="E-mail"
            name="email"
            type="email"
          />
          <FormInput
            autoComplete="new-password"
            control={form.control}
            label="Senha"
            name="password"
            type="password"
          />
          <FormInput
            autoComplete="new-password"
            control={form.control}
            label="Confirmar senha"
            name="confirmPassword"
            type="password"
          />

          {registerMutation.isError ? (
            <p className="text-sm text-destructive" role="alert">
              Não foi possível criar a conta. Verifique os dados e tente novamente.
            </p>
          ) : null}

          <Button className="w-full" disabled={isLoading} type="submit">
            {isLoading ? 'Criando...' : 'Criar conta'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Já possui uma conta?{' '}
            <Link className="underline underline-offset-4" to="/login">
              Entrar
            </Link>
          </p>
        </form>
      </Form>
    </section>
  )
}
