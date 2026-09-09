import { Link } from "react-router";
import { LoginForm } from "@/features/auth/components/login-form";

/**
 * Page responsible for the visual context of the login screen.
 *
 * LoginForm remains responsible for fields, validation, and data submission.
 * The page simply combines the form with DevLog branding and a
 * centered layout, giving each component a small responsibility
 * that is easy to test.
 */
export default function LoginPage() {
  return (
    <main className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-background px-6 py-12 sm:px-8">
      {/*
       * Decorative elements stay outside the flow and are ignored by screen
       * readers. This keeps the page appearance from interfering with keyboard
       * navigation or form reading.
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
         * Linking the brand to the home page provides a clear way out for
         * visitors who reached login by mistake, without adding a new navigation
         * rule inside the form.
         */}
        <Link
          aria-label="Go to the DevLog home page"
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
