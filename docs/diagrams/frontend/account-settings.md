# Frontend diagrams — Account settings

These sequences describe the authenticated `/settings` forms. Zod validates
form data before the PATCH calls. The API remains responsible for validating
the request and, for a password change, verifying the current password.

## Update profile name

```mermaid
sequenceDiagram
    actor user as AuthenticatedUser
    participant page as SettingsPage
    participant form as ProfileForm
    participant mutation as useUpdateUser
    participant api as UsersAPI
    participant cache as ReactQueryCache

    user->>page: Open settings
    page->>cache: Read currentUserQueryKey
    cache-->>page: Current user data
    page->>form: Reset defaults to current name
    user->>form: Edit name and submit
    form->>form: Validate with updateUserSchema
    form->>mutation: Submit valid name
    mutation->>api: PATCH /users/me name
    api-->>mutation: Updated canonical user
    mutation->>cache: setQueryData currentUserQueryKey
    mutation-->>page: Success
    page->>form: Reset to saved name
    page-->>user: Show success notification
```

Invalid names stay in the form with a field error and never start a mutation.
The returned user synchronizes the account page and sidebar from the shared
cache without another GET. Mutation failures show an error notification and
leave the user's draft in place.

## Change password

```mermaid
sequenceDiagram
    actor user as AuthenticatedUser
    participant form as PasswordForm
    participant mutation as useUpdateUserPassword
    participant api as UsersAPI
    participant page as SettingsPage

    user->>form: Enter current, new, and confirmation values
    user->>form: Submit password change
    form->>form: Validate required fields and match
    form->>mutation: Submit valid credentials
    mutation->>api: PATCH /users/me/password
    api-->>mutation: Success or validation error
    mutation-->>page: Mutation result
    page-->>user: Show success or error notification
```

On success the page clears all password fields. On failure it keeps the values
so the user can correct and resubmit. The API call still contains
`confirmPassword`, matching the existing DTO contract. The profile and password
forms have independent pending states.

## Source and related reading

- [Settings page and both forms](../../../apps/web/src/features/auth/pages/settings-page.tsx)
- [Client schemas](../../../apps/web/src/features/auth/schemas/settings.schema.ts)
- [Profile mutation and cache update](../../../apps/web/src/features/auth/hooks/use-update-user.ts)
- [Password mutation](../../../apps/web/src/features/auth/hooks/use-update-user-password.ts)
- [Validation and tests](../../guides/account-settings.md)
