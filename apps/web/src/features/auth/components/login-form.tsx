import type { SubmitHandler } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { FormInput } from '@/components/ui/form-input'
import { useLogin } from '@/features/auth/hooks/use-login'
import { useLoginForm } from '@/features/auth/hooks/use-login-form'
import type { LoginFormData } from '@/features/auth/types/auth'

/**
 * Form responsible for the login interface and orchestration.
 *
 * Validation lives in the schema (schemas/login.schema.ts), React Hook Form
 * configuration lives in useLoginForm, and the HTTP call lives in useLogin.
 * Separating these responsibilities makes the component easier to understand
 * and lets other places reuse the same logic when needed.
 */
export function LoginForm() {
  const form = useLoginForm()
  const loginMutation = useLogin()

  const { handleSubmit } = form

  /**
   * `handleSubmit` calls this function only after the Zod resolver
   * validates the fields. Therefore, `data` already has the shape of
   * LoginFormData, so no manual email/password validation is needed here.
   */
  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    try {
      // `mutateAsync` lets submission await the request, keeping
      // React Hook Form's `isSubmitting` accurate.
      await loginMutation.mutateAsync(data)
    } catch {
      // The hook displays server errors in a toast. Catch the exception to
      // avoid an unhandled Promise rejection in the submit event.
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
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account to continue to DevLog.
          </p>
        </div>

        <div className="space-y-5">
          {/* Keep the submitted values stable until the mutation settles. */}
          <FormInput
            autoComplete="email"
            control={form.control}
            disabled={isLoading}
            label="E-mail"
            name="email"
            placeholder="you@example.com"
            type="email"
          />
          <FormInput
            autoComplete="current-password"
            control={form.control}
            disabled={isLoading}
            label="Password"
            name="password"
            placeholder="Enter your password"
            type="password"
          />
        </div>

        <Button className="w-full" disabled={isLoading} size="lg" type="submit">
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </Form>
  )
}
