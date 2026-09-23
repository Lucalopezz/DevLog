import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { KeyRound, LoaderCircle, Settings2, UserRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { FormInput } from '@/components/ui/form-input'
import { useGetUser } from '@/features/auth/hooks/use-get-user'
import { useUpdateUser } from '@/features/auth/hooks/use-update-user'
import { useUpdateUserPassword } from '@/features/auth/hooks/use-update-user-password'
import {
  updatePasswordSchema,
  updateUserSchema,
  type UpdatePasswordInput,
  type UpdateUserInput,
} from '@/features/auth/schemas/settings.schema'

export default function SettingsPage() {
  const { data: user, isPending } = useGetUser()
  const updateUserMutation = useUpdateUser()
  const updatePasswordMutation = useUpdateUserPassword()

  const profileForm = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { name: user?.name ?? '' },
  })
  const passwordForm = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
  })

  // The user query resolves after the initial render, so synchronize the
  // profile form when server data arrives instead of leaving its first blank
  // default in place.
  useEffect(() => {
    if (user) {
      profileForm.reset({ name: user.name })
    }
  }, [profileForm, user])

  if (isPending) {
    return <p className="text-muted-foreground">Loading settings...</p>
  }

  // Protected routes normally guarantee a user; this guard keeps the page safe
  // if it is rendered outside the router in a story or another test harness.
  if (!user) {
    return null
  }

  const saveProfile: SubmitHandler<UpdateUserInput> = async (input) => {
    try {
      const updatedUser = await updateUserMutation.mutateAsync(input)
      profileForm.reset({ name: updatedUser.name })
    } catch {
      // The mutation hook reports server errors with a toast.
    }
  }

  const savePassword: SubmitHandler<UpdatePasswordInput> = async (input) => {
    try {
      await updatePasswordMutation.mutateAsync(input)
      // Password fields should be cleared after a successful credential change.
      passwordForm.reset()
    } catch {
      // Keep the entered values so the user can correct a rejected request.
    }
  }

  const isSavingProfile = profileForm.formState.isSubmitting || updateUserMutation.isPending
  const isSavingPassword = passwordForm.formState.isSubmitting || updatePasswordMutation.isPending

  return (
    <section className="mx-auto w-full max-w-3xl space-y-8">
      <header className="flex items-center gap-3">
        <Settings2 aria-hidden="true" className="size-8" />
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your profile and sign-in credentials.
          </p>
        </div>
      </header>

      <section aria-labelledby="profile-heading" className="space-y-5 rounded-xl border bg-card p-6">
        <div className="flex items-start gap-3">
          <UserRound aria-hidden="true" className="mt-0.5 size-5 text-muted-foreground" />
          <div>
            <h2 className="font-semibold" id="profile-heading">Profile</h2>
            <p className="text-sm text-muted-foreground">
              Update the name shown across your workspace.
            </p>
          </div>
        </div>

        <Form {...profileForm}>
          <form
            aria-busy={isSavingProfile}
            className="space-y-5"
            noValidate
            onSubmit={profileForm.handleSubmit(saveProfile)}
          >
            <FormInput
              autoComplete="name"
              control={profileForm.control}
              disabled={isSavingProfile}
              label="Name"
              name="name"
            />
            <div className="space-y-2">
              <p className="text-sm font-medium">E-mail</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                E-mail address changes are not available yet.
              </p>
            </div>
            <Button disabled={isSavingProfile} type="submit">
              {isSavingProfile ? (
                <><LoaderCircle aria-hidden="true" className="animate-spin" /> Saving...</>
              ) : 'Save profile'}
            </Button>
          </form>
        </Form>
      </section>

      <section aria-labelledby="password-heading" className="space-y-5 rounded-xl border bg-card p-6">
        <div className="flex items-start gap-3">
          <KeyRound aria-hidden="true" className="mt-0.5 size-5 text-muted-foreground" />
          <div>
            <h2 className="font-semibold" id="password-heading">Change password</h2>
            <p className="text-sm text-muted-foreground">
              Confirm your current password before choosing a new one.
            </p>
          </div>
        </div>

        <Form {...passwordForm}>
          <form
            aria-busy={isSavingPassword}
            className="space-y-5"
            noValidate
            onSubmit={passwordForm.handleSubmit(savePassword)}
          >
            <FormInput
              autoComplete="current-password"
              control={passwordForm.control}
              disabled={isSavingPassword}
              label="Current password"
              name="currentPassword"
              type="password"
            />
            <FormInput
              autoComplete="new-password"
              control={passwordForm.control}
              disabled={isSavingPassword}
              label="New password"
              name="password"
              type="password"
            />
            <FormInput
              autoComplete="new-password"
              control={passwordForm.control}
              disabled={isSavingPassword}
              label="Confirm new password"
              name="confirmPassword"
              type="password"
            />
            <Button disabled={isSavingPassword} type="submit">
              {isSavingPassword ? (
                <><LoaderCircle aria-hidden="true" className="animate-spin" /> Updating...</>
              ) : 'Update password'}
            </Button>
          </form>
        </Form>
      </section>
    </section>
  )
}
