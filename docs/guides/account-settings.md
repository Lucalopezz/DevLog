# Account settings

The authenticated `/settings` page lets users update their profile name and
change their password. `/account` remains a read-only profile view. Email is
displayed in both places and cannot be changed under the current API contract.

See the [form sequence diagrams](../diagrams/frontend/account-settings.md) for
how forms, validation, mutations, and the user cache work together. Backend
rules remain in [UC-05 and UC-06](../usecases/account-and-tags.md#uc-05--update-profile).

## Form and request flow

`SettingsPage` owns two independent React Hook Form instances. Each uses
`zodResolver` with a schema from `settings.schema.ts`; invalid input produces
field errors before a mutation or HTTP request starts.

| Form | Client validation | Request body | Endpoint |
| --- | --- | --- | --- |
| Profile | Name has at least 3 characters | `name` | `PATCH /users/me` |
| Password | Current password and confirmation are required; new password has at least 6 characters and matches confirmation | `currentPassword`, `password`, `confirmPassword` | `PATCH /users/me/password` |

The API functions use the shared Axios client and its authentication cookie.
Client validation gives immediate feedback; the API still validates payloads
and verifies the current password. Password confirmation is also sent to the
API because it is part of the existing request contract.

## Profile synchronization

`useGetUser` reads the same `currentUserQueryKey` used by the protected-route
loader. Form defaults are initial values, so an effect resets the profile form
when user data arrives. After a successful update, `useUpdateUser` writes the
returned user into that shared cache with `setQueryData`; the sidebar and
account page read the updated name from the same source. The page also resets
the profile form to the saved name.

Using the returned user avoids another GET for data already present in the
PATCH response. This assumes the response contains the canonical user, as the
current contract does. The synchronization effect resets unsaved name input if
the shared user data changes while editing; it does not merge drafts.

## Pending, success, and failure

- Each form combines its submission state with its mutation's pending state.
  Its fields and submit button are disabled while saving, and `aria-busy`
  describes that state. The other form has its own state.
- Mutation hooks own success/error notifications. Page handlers catch rejected
  `mutateAsync` calls without duplicating those notifications.
- A successful password change clears all password fields. A rejected request
  keeps the entered values available for correction.
- The password mutation does not replace the cached user or navigate away. It
  reports success and lets the page reset its form.

## Validation and study notes

The [page tests](../../apps/web/src/features/auth/pages/settings-page.spec.tsx)
exercise profile loading/cache synchronization, short-name validation, password
pending state/reset, and mismatched confirmation. The
[API tests](../../apps/web/src/features/auth/api/settings-api.spec.ts) assert
both PATCH payloads and returned user data.

Useful concepts to study are form defaults versus asynchronous server data,
schema/resolver collaboration, independent mutations, and direct cache updates
versus query invalidation.
