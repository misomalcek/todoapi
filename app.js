'use strict';

const express = require('express');
const { TodoStore } = require('./todos');

/**
 * Build the Express app. The db is injected so tests can pass an in-memory DB.
 *
 * @param {import('better-sqlite3').Database} db
 * @returns {import('express').Express}
 */
function createApp(db) {
  const app = express();
  const store = new TodoStore(db);

  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // List all todos
  app.get('/todos', (_req, res) => {
    res.json(store.list());
  });

  // Create a todo
  app.post('/todos', (req, res) => {
    const { title, completed } = req.body || {};
    const error = validateTitle(title);
    if (error) return res.status(400).json({ error });
    if (completed !== undefined && typeof completed !== 'boolean') {
      return res.status(400).json({ error: '`completed` must be a boolean' });
    }

    const todo = store.create({ title: title.trim(), completed });
    res.status(201).location(`/todos/${todo.id}`).json(todo);
  });

  // Get one todo
  app.get('/todos/:id', withId((req, res, id) => {
    const todo = store.get(id);
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    res.json(todo);
  }));

  // Replace a todo (full update)
  app.put('/todos/:id', withId((req, res, id) => {
    const { title, completed } = req.body || {};
    const error = validateTitle(title);
    if (error) return res.status(400).json({ error });
    if (completed !== undefined && typeof completed !== 'boolean') {
      return res.status(400).json({ error: '`completed` must be a boolean' });
    }

    const todo = store.update(id, {
      title: title.trim(),
      completed: completed === undefined ? false : completed,
    });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    res.json(todo);
  }));

  // Partially update a todo
  app.patch('/todos/:id', withId((req, res, id) => {
    const { title, completed } = req.body || {};

    if (title !== undefined) {
      const error = validateTitle(title);
      if (error) return res.status(400).json({ error });
    }
    if (completed !== undefined && typeof completed !== 'boolean') {
      return res.status(400).json({ error: '`completed` must be a boolean' });
    }
    if (title === undefined && completed === undefined) {
      return res
        .status(400)
        .json({ error: 'Provide at least one of `title` or `completed`' });
    }

    const todo = store.update(id, {
      title: title === undefined ? undefined : title.trim(),
      completed,
    });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    res.json(todo);
  }));

  // Delete a todo
  app.delete('/todos/:id', withId((req, res, id) => {
    const removed = store.remove(id);
    if (!removed) return res.status(404).json({ error: 'Todo not found' });
    res.status(204).end();
  }));

  // 404 for anything else
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Central error handler (e.g. malformed JSON body)
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

/** Validate an :id path param before handing off to the handler. */
function withId(handler) {
  return (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    return handler(req, res, id);
  };
}

function validateTitle(title) {
  if (title === undefined || title === null) return '`title` is required';
  if (typeof title !== 'string') return '`title` must be a string';
  if (title.trim().length === 0) return '`title` cannot be empty';
  if (title.length > 500) return '`title` is too long (max 500 chars)';
  return null;
}

module.exports = { createApp };
