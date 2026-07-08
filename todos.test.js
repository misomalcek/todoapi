'use strict';

const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const { createApp } = require('../src/app');
const { createDb } = require('../src/db');

/** Fresh in-memory app per test for full isolation. */
function makeApp() {
  return createApp(createDb(':memory:'));
}

test('GET /health returns ok', async () => {
  const res = await request(makeApp()).get('/health');
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.body, { status: 'ok' });
});

test('GET /todos is empty initially', async () => {
  const res = await request(makeApp()).get('/todos');
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.body, []);
});

test('POST /todos creates a todo', async () => {
  const app = makeApp();
  const res = await request(app).post('/todos').send({ title: 'Buy milk' });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.title, 'Buy milk');
  assert.strictEqual(res.body.completed, false);
  assert.ok(res.body.id > 0);
  assert.strictEqual(res.headers.location, `/todos/${res.body.id}`);
});

test('POST /todos rejects missing title', async () => {
  const res = await request(makeApp()).post('/todos').send({});
  assert.strictEqual(res.status, 400);
  assert.match(res.body.error, /title/);
});

test('POST /todos rejects empty title', async () => {
  const res = await request(makeApp()).post('/todos').send({ title: '   ' });
  assert.strictEqual(res.status, 400);
});

test('POST /todos rejects non-boolean completed', async () => {
  const res = await request(makeApp())
    .post('/todos')
    .send({ title: 'x', completed: 'yes' });
  assert.strictEqual(res.status, 400);
});

test('GET /todos/:id returns a specific todo', async () => {
  const app = makeApp();
  const created = await request(app).post('/todos').send({ title: 'Read' });
  const res = await request(app).get(`/todos/${created.body.id}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.title, 'Read');
});

test('GET /todos/:id returns 404 for unknown id', async () => {
  const res = await request(makeApp()).get('/todos/999');
  assert.strictEqual(res.status, 404);
});

test('GET /todos/:id returns 400 for invalid id', async () => {
  const res = await request(makeApp()).get('/todos/abc');
  assert.strictEqual(res.status, 400);
});

test('PUT /todos/:id replaces a todo', async () => {
  const app = makeApp();
  const created = await request(app).post('/todos').send({ title: 'Old' });
  const res = await request(app)
    .put(`/todos/${created.body.id}`)
    .send({ title: 'New', completed: true });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.title, 'New');
  assert.strictEqual(res.body.completed, true);
});

test('PATCH /todos/:id updates completed only', async () => {
  const app = makeApp();
  const created = await request(app).post('/todos').send({ title: 'Task' });
  const res = await request(app)
    .patch(`/todos/${created.body.id}`)
    .send({ completed: true });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.title, 'Task'); // unchanged
  assert.strictEqual(res.body.completed, true);
});

test('PATCH /todos/:id requires at least one field', async () => {
  const app = makeApp();
  const created = await request(app).post('/todos').send({ title: 'Task' });
  const res = await request(app).patch(`/todos/${created.body.id}`).send({});
  assert.strictEqual(res.status, 400);
});

test('DELETE /todos/:id removes a todo', async () => {
  const app = makeApp();
  const created = await request(app).post('/todos').send({ title: 'Bye' });

  const del = await request(app).delete(`/todos/${created.body.id}`);
  assert.strictEqual(del.status, 204);

  const after = await request(app).get(`/todos/${created.body.id}`);
  assert.strictEqual(after.status, 404);
});

test('DELETE /todos/:id returns 404 for unknown id', async () => {
  const res = await request(makeApp()).delete('/todos/12345');
  assert.strictEqual(res.status, 404);
});

test('malformed JSON returns 400', async () => {
  const res = await request(makeApp())
    .post('/todos')
    .set('Content-Type', 'application/json')
    .send('{ bad json');
  assert.strictEqual(res.status, 400);
});

test('unknown route returns 404', async () => {
  const res = await request(makeApp()).get('/nope');
  assert.strictEqual(res.status, 404);
});
