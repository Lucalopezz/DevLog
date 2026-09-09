import { CircleUserRound } from 'lucide-react'
import { useGetUser } from '@/features/auth/hooks/use-get-user'

export default function AccountPage() {
  const { data: user, isPending } = useGetUser()

  if (isPending) {
    return <p className="text-muted-foreground">Loading account...</p>
  }

  // The route loader already prevents this case, but keeping this guard makes the
  // component safe if it is reused on another route in the future.
  if (!user) {
    return null
  }

  return (
    <section className="mx-auto w-full max-w-2xl space-y-6">
      <header className="flex items-center gap-3">
        <CircleUserRound className="size-8" />
        <div>
          <h1 className="text-2xl font-semibold">User account</h1>
          <p className="text-sm text-muted-foreground">
            Your DevLog session information.
          </p>
        </div>
      </header>

      <dl className="space-y-4 rounded-xl border bg-card p-6">
        <div>
          <dt className="text-sm font-medium text-muted-foreground">Name</dt>
          <dd>{user.name}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-muted-foreground">E-mail</dt>
          <dd>{user.email}</dd>
        </div>
      </dl>
    </section>
  )
}
