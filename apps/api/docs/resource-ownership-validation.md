# User and resource ownership validation

## General rule

User-owned API resources (`Project`, `TechnicalEntry`, and `Tag`) must be accessible only to their authenticated owner.

The `userId` used by use cases comes from `CurrentUser`, populated by `AuthGuard` from the JWT. It must not be trusted when supplied in the client request body.

## When to query `UserRepository`

During resource creation, there is no existing resource to query for ownership. The use case must therefore verify that the user exists before creating it:

```ts
const user = await this.userRepository.findById(userId);

if (user === null) {
  throw new NotFoundException('User not found');
}
```

This also prevents an unhandled database foreign key error from reaching the application without an appropriate business response.

The rule currently applies to:

- `CreateProjectUseCase`;
- `CreateTechnicalEntryUseCase`;
- `CreateTagUseCase`.

## When the resource query is sufficient

For an existing resource, querying the resource can validate existence and authorization together:

```ts
const project = await this.projectRepository.findById(input.id);

if (project === null || project.userId !== input.userId) {
  throw new NotFoundException('Project not found');
}
```

This condition means:

1. If the resource does not exist, the operation fails.
2. If it exists but belongs to another user, the operation also fails.
3. Only the owner continues.

There is no need to inject `UserRepository` into every update, query, or delete use case for projects and technical entries. Query the resource and check its `userId`.

This strategy is currently used by:

- `UpdateProjectUseCase`;
- `ArchiveProjectUseCase`;
- `RestoreProjectUseCase`;
- `GetProjectUseCase`;
- `DeleteProjectUseCase`;
- `UpdateTechnicalEntryUseCase`;
- `GetTechnicalEntryUseCase`;
- `DeleteTechnicalEntryUseCase`.

For searches and lists, apply the same protection directly in the filter:

```ts
const filter = { userId: input.userId };
```

The application then does not need to load other users' records just to discard them.

## Why is the user still valid in these cases?

In the database, `Project.userId`, `TechnicalEntry.userId`, and `Tag.userId` are required foreign keys to `User`. Their relationships use `onDelete: Cascade`, so an existing resource should not point to a missing user.

Finding a project or technical entry belonging to the authenticated user therefore indirectly guarantees the user's existence through that relationship.

## Exception: validating the authenticated user in `AuthGuard`

The current `AuthGuard` verifies JWT signature and validity but does not query the database to confirm that the user still exists. If a user is deleted after token issuance, the token may remain valid until it expires.

This does not require adding `UserRepository` to every use case. If product rules require immediate revocation, disabled users, or an existence check on every request, centralize that responsibility in the authentication flow (`AuthGuard` or an authentication strategy).

## Decision reference

| Operation | Main validation |
| --- | --- |
| Create a project, entry, or tag | Query `UserRepository` |
| Create an entry with a project | Query the user and validate project/ownership |
| Update, query, or delete | Find the resource and check `resource.userId` |
| List | Filter by `userId` |
| Immediately invalidate a user/token | Validate the user in the authentication flow |
