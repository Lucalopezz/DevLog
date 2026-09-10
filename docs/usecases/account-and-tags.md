# Use cases — account, authentication, and tags

The validation failures mentioned below include format, length, and required
fields. Cross-cutting rules are in the [index](README.md).

## UC-01 — Register user

| Field          | Description                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| Primary actor  | Guest                                                                                                          |
| Interests      | The guest wants to create an account; the system must enforce unique email addresses and protect the password. |
| Preconditions  | The guest does not need to be authenticated.                                                                   |
| Trigger        | The guest submits a name, email, password, and confirmation.                                                   |
| Postconditions | An account is created with a hashed password; the password is not returned.                                    |
| Endpoint       | `POST /api/users`                                                                                              |

### Main flow

1. The guest provides their details.
2. The system confirms that both passwords match.
3. The system confirms that the email is not already registered.
4. The system hashes the password and saves the account.
5. The system returns the user's public data.

### Alternative flows

- 2a. The passwords differ: the system rejects registration.
- 3a. The email already exists: the system reports a conflict and does not create another account.
- 1a. Some data is invalid: the system reports validation errors.

## UC-02 — Authenticate user

| Field          | Description                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Primary actor  | Guest                                                                                                                     |
| Interests      | The guest wants to access their data; the system must accept only valid credentials without revealing which field failed. |
| Preconditions  | A matching account must exist.                                                                                            |
| Trigger        | The guest provides an email and password.                                                                                 |
| Postconditions | A temporary token is sent in an HttpOnly cookie and the user's public data is returned.                                   |
| Endpoint       | `POST /api/auth/login`                                                                                                    |

### Main flow

1. The guest provides their credentials.
2. The system finds the account by email.
3. The system compares the supplied password against the password hash.
4. The system creates an access credential associated with the user.
5. The system starts the client session and returns the authenticated user.

### Alternative flows

- 2a/3a. Missing account or incorrect password: the system responds only with
  “Invalid credentials”.
- 1a. The data format is invalid: the system rejects the request.

## UC-03 — End session

| Field          | Description                                                        |
| -------------- | ------------------------------------------------------------------ |
| Primary actor  | Guest or authenticated user                                        |
| Interests      | The actor wants the client to stop sending the current credential. |
| Preconditions  | None; the operation also works without a valid session.            |
| Trigger        | The actor requests logout.                                         |
| Postconditions | The access cookie is removed from the client.                      |
| Endpoint       | `POST /api/auth/logout`                                            |

### Main flow

1. The actor requests to end the session.
2. The system instructs the client to remove the access cookie.
3. The system confirms the operation without returning content.

### Alternative flows

- There is no server-side revocation flow; a token copied before logout
  remains technically valid until it expires.

## UC-04 — View current profile

| Field          | Description                                                                        |
| -------------- | ---------------------------------------------------------------------------------- |
| Primary actor  | Authenticated user                                                                 |
| Interests      | The user wants to view their public data; the system must not expose the password. |
| Preconditions  | Authenticated request.                                                             |
| Trigger        | The user requests their profile.                                                   |
| Postconditions | The system state does not change.                                                  |
| Endpoint       | `GET /api/users/me`                                                                |

### Main flow

1. The user requests their own profile.
2. The system finds the account identified by the session.
3. The system returns the ID, name, email, and timestamps.

### Alternative flows

- 2a. The session account no longer exists: the system reports that the user was not found.
- Missing or invalid authentication stops the use case before step 1.

## UC-05 — Update profile

| Field          | Description                                                                 |
| -------------- | --------------------------------------------------------------------------- |
| Primary actor  | Authenticated user                                                          |
| Interests      | The user wants to change their name while keeping their identity and email. |
| Preconditions  | Authenticated request and existing account.                                 |
| Trigger        | The user provides the new name.                                             |
| Postconditions | The name and update timestamp are changed.                                  |
| Endpoint       | `PATCH /api/users/me`                                                       |

### Main flow

1. The user provides the new name.
2. The system finds their account.
3. The system validates and saves the new name.
4. The system returns the updated profile.

### Alternative flows

- 2a. The account does not exist: the system reports that the user was not found.
- 3a. The name is invalid: nothing changes and errors are returned.

## UC-06 — Change password

| Field          | Description                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Primary actor  | Authenticated user                                                                                                     |
| Interests      | The user wants to change their password; the system must verify their identity and never persist a plaintext password. |
| Preconditions  | Authenticated request and existing account.                                                                            |
| Trigger        | The user provides the current password, new password, and confirmation.                                                |
| Postconditions | The new password hash replaces the previous one.                                                                       |
| Endpoint       | `PATCH /api/users/me/password`                                                                                         |

### Main flow

1. The user provides all three password fields.
2. The system confirms that the new password and confirmation match.
3. The system validates the current password.
4. The system hashes and saves the new password.
5. The system returns the updated profile.

### Alternative flows

- 2a. The new password and confirmation differ: the change is rejected.
- 3a. The current password is invalid: the change is rejected.
- 1a. The account does not exist or the data is invalid: nothing changes.

## UC-07 — Create tag

| Field          | Description                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| Primary actor  | Authenticated user                                                                                          |
| Interests      | The user wants to create a reusable classification; the system must prevent equivalent duplicates per user. |
| Preconditions  | Authenticated request.                                                                                      |
| Trigger        | The user provides the tag name.                                                                             |
| Postconditions | A normalized tag belonging to the user is created.                                                          |
| Endpoint       | `POST /api/tag`                                                                                             |

### Main flow

1. The user provides the name.
2. The system normalizes the name for comparison.
3. The system confirms that no equivalent tag exists for this user.
4. The system creates and returns the tag.

### Alternative flows

- 3a. A tag with the normalized name already exists: the system reports a conflict.
- 1a. Invalid name or missing account: the tag is not created.

## UC-08 — Search tags

| Field          | Description                                                                        |
| -------------- | ---------------------------------------------------------------------------------- |
| Primary actor  | Authenticated user                                                                 |
| Interests      | The user wants to find their classifications without seeing other users' tags.     |
| Preconditions  | Authenticated request.                                                             |
| Trigger        | The user requests the list, optionally specifying a name, pagination, and sorting. |
| Postconditions | The system state does not change.                                                  |
| Endpoint       | `GET /api/tag`                                                                     |

### Main flow

1. The user provides optional criteria.
2. The system restricts the search to the user's tags.
3. The system applies filtering, pagination, and sorting.
4. The system returns items and pagination metadata.

### Alternative flows

- 3a. No tags match: the system returns an empty page.
- 1a. A criterion is invalid: the search is rejected.

## UC-09 — Delete tag

| Field          | Description                                                                        |
| -------------- | ---------------------------------------------------------------------------------- |
| Primary actor  | Authenticated user                                                                 |
| Interests      | The user wants to remove their own classification; classified entries must remain. |
| Preconditions  | Authenticated request and a tag belonging to the user.                             |
| Trigger        | The user chooses to delete the tag.                                                |
| Postconditions | The tag and its entry associations are removed; the entries remain.                |
| Endpoint       | `DELETE /api/tag/:id`                                                              |

### Main flow

1. The user specifies the tag.
2. The system verifies ownership.
3. The system deletes the tag and its assignments.
4. The system confirms without returning content.

### Alternative flows

- 2a. The tag does not exist or belongs to another user: the system responds with tag not found.
