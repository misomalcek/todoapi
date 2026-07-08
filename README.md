# Todo API

A simple, production-ready REST API for a todo list, backed by a real SQLite database.

## Stack

- **Node.js** + **Express 5** — HTTP server and routing
- **SQLite** via **better-sqlite3** — a real relational database in a single file (no server to run)
- **node:test** + **supertest** — endpoint tests

## Setup

```bash
npm install
npm start          # starts on http://localhost:3000
# or
npm run dev        # auto-restart on file changes
```

The database file is created automatically at `data/todos.db`.
Override the location with env vars:

```bash
PORT=8080 DB_PATH=/tmp/my-todos.db npm start
```

## Run the tests

```bash
npm test
```

## Data model

| Field       | Type    | Notes                              |
|-------------|---------|------------------------------------|
| `id`        | integer | Auto-incrementing primary key      |
| `title`     | string  | Required, 1–500 chars              |
| `completed` | boolean | Defaults to `false`                |
| `createdAt` | string  | Set on creation (UTC)              |
| `updatedAt` | string  | Updated on every change (UTC)      |

## Endpoints

| Method | Path          | Description                       | Success |
|--------|---------------|-----------------------------------|---------|
| GET    | `/health`     | Health check                      | 200     |
| GET    | `/todos`      | List all todos                    | 200     |
| POST   | `/todos`      | Create a todo                     | 201     |
| GET    | `/todos/:id`  | Get one todo                      | 200     |
| PUT    | `/todos/:id`  | Replace a todo (full update)      | 200     |
| PATCH  | `/todos/:id`  | Partial update                    | 200     |
| DELETE | `/todos/:id`  | Delete a todo                     | 204     |

### Request/response examples

Create:

```bash
curl -X POST localhost:3000/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Buy milk"}'
```

```json
{ "id": 1, "title": "Buy milk", "completed": false,
  "createdAt": "2026-07-03 01:45:07", "updatedAt": "2026-07-03 01:45:07" }
```

Mark complete (partial update):

```bash
curl -X PATCH localhost:3000/todos/1 \
  -H 'Content-Type: application/json' \
  -d '{"completed":true}'
```

Delete:

```bash
curl -X DELETE localhost:3000/todos/1   # -> 204 No Content
```

## Error handling

Errors return a JSON body `{ "error": "..." }` with an appropriate status code:

- `400` — validation failure (missing/empty/too-long title, bad `completed`, invalid id, malformed JSON)
- `404` — todo or route not found
- `500` — unexpected server error

## Project layout

```
src/
  app.js       Express app + routes (db injected for testability)
  db.js        SQLite connection + schema
  todos.js     Data-access layer (all SQL lives here)
  server.js    Entry point (starts server, graceful shutdown)
test/
  todos.test.js
```

## Swapping the database later

All SQL is isolated in `src/todos.js` and the connection in `src/db.js`.
To move to Postgres/MySQL, replace those two files with an equivalent
implementation of the same `TodoStore` interface — the routes and tests stay the same.
```
```
