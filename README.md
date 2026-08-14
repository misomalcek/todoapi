# todoapi

A small REST API backed by a real SQLite database. Express, `node:test`, no ORM.

**Status: working, 16/16 tests passing.**

This is a deliberately unambitious project, published because a small complete
thing is more informative than a large incomplete one. It has the parts that
usually get skipped in a demo: input validation with specific error messages,
correct status codes, a real database rather than an in-memory array, and tests
that cover the failure paths rather than only the happy one.

## Running it

```bash
npm ci
npm test        # 16 tests
npm start       # http://localhost:3000
```

## What it does

| method | path | behaviour |
|---|---|---|
| `GET` | `/health` | liveness |
| `GET` | `/todos` | list |
| `POST` | `/todos` | create — rejects missing, empty, or non-string titles |
| `GET` | `/todos/:id` | fetch one — 404 for unknown ids |
| `PATCH` | `/todos/:id` | update — rejects a non-boolean `completed` |
| `DELETE` | `/todos/:id` | remove |

## Notes

The tests import the app and database as modules and build a fresh database per
run, so they are hermetic and there is no cleanup step. `createApp(db)` takes its
database as an argument for the same reason — the API has no opinion about where
its storage comes from.

**One honest detail:** the test file's imports were broken when this was
published — they pointed at a `src/` directory that no longer existed after a
reorganisation. The code was fine; the tests could not load it. Fixed by pointing
them at the real paths. It is a good illustration of why "it compiles" is not
evidence: nothing failed to compile, and every test was silently unrunnable.
