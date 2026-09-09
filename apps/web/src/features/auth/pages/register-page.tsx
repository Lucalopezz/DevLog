import { zodResolver } from '@hookform/resolvers/zod'
import type { SubmitHandler } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { FormInput } from '@/components/ui/form-input'
import { useRegister } from '@/features/auth/hooks/use-register'
import { registerSchema } from '@/features/auth/schemas/register.schema'
import type { RegisterFormData } from '@/features/auth/types/auth'

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
      // The hook displays server errors in a toast; catch prevents an unhandled
      // Promise rejection in the submit event.
    }
  }

  const isLoading = form.formState.isSubmitting || registerMutation.isPending

  return (
    <section className="mx-auto w-full max-w-md space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="text-sm text-muted-foreground">
          Create your account to start recording what you learn.
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
            label="Name"
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
            label="Password"
            name="password"
            type="password"
          />
          <FormInput
            autoComplete="new-password"
            control={form.control}
            label="Confirm password"
            name="confirmPassword"
            type="password"
          />

          <Button className="w-full" disabled={isLoading} type="submit">
            {isLoading ? 'Creating...' : 'Create account'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link className="underline underline-offset-4" to="/login">
              Sign in
            </Link>
          </p>
        </form>
      </Form>
    </section>
  )
}
