import { CircleUserRound } from 'lucide-react'
import { useGetUser } from '@/features/auth/hooks/use-get-user'

export default function AccountPage() {
  const { data: user, isPending } = useGetUser()

  if (isPending) {
    return <p className="text-muted-foreground">Carregando conta...</p>
  }

  // O loader da rota já impede este caso, mas manter a proteção torna o
  // componente seguro caso ele seja reutilizado em outra rota futuramente.
  if (!user) {
    return null
  }

  return (
    <section className="mx-auto w-full max-w-2xl space-y-6">
      <header className="flex items-center gap-3">
        <CircleUserRound className="size-8" />
        <div>
          <h1 className="text-2xl font-semibold">Conta do usuário</h1>
          <p className="text-sm text-muted-foreground">
            Informações da sua sessão no DevLog.
          </p>
        </div>
      </header>

      <dl className="space-y-4 rounded-xl border bg-card p-6">
        <div>
          <dt className="text-sm font-medium text-muted-foreground">Nome</dt>
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
