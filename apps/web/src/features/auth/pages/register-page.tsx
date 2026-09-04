import type { SubmitHandler } from 'react-hook-form'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRegister } from '@/features/auth/hooks/use-register'
import { registerSchema } from '@/features/auth/register.schema'
import type { RegisterFormData } from '@/features/auth/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

export default function RegisterPage() {
  const registerMutation = useRegister()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
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

  const isLoading = isSubmitting || registerMutation.isPending

  return (
    <section className="mx-auto w-full max-w-md space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Criar conta</h1>
        <p className="text-sm text-muted-foreground">
          Crie seu usuário para começar a registrar seus aprendizados.
        </p>
      </header>

      <form
        className="space-y-5 rounded-2xl border bg-card p-6"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="name">
            Nome
          </label>
          <Input {...register('name')} id="name" autoComplete="name" />
          {errors.name ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="register-email">
            E-mail
          </label>
          <Input
            {...register('email')}
            id="register-email"
            autoComplete="email"
            type="email"
          />
          {errors.email ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="register-password">
            Senha
          </label>
          <Input
            {...register('password')}
            id="register-password"
            autoComplete="new-password"
            type="password"
          />
          {errors.password ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium"
            htmlFor="register-confirm-password"
          >
            Confirmar senha
          </label>
          <Input
            {...register('confirmPassword')}
            id="register-confirm-password"
            autoComplete="new-password"
            type="password"
          />
          {errors.confirmPassword ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

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
    </section>
  )
}
