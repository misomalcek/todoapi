'use strict';

/**
 * Data-access layer for todos. Keeps all SQL in one place so the routes stay thin.
 */
class TodoStore {
  constructor(db) {
    this.db = db;
    this._insert = db.prepare(
      'INSERT INTO todos (title, completed) VALUES (@title, @completed)'
    );
    this._all = db.prepare('SELECT * FROM todos ORDER BY id');
    this._byId = db.prepare('SELECT * FROM todos WHERE id = ?');
    this._update = db.prepare(
      `UPDATE todos
         SET title = @title,
             completed = @completed,
             updated_at = datetime('now')
       WHERE id = @id`
    );
    this._delete = db.prepare('DELETE FROM todos WHERE id = ?');
  }

  list() {
    return this._all.all().map(toApi);
  }

  get(id) {
    const row = this._byId.get(id);
    return row ? toApi(row) : null;
  }

  create({ title, completed = false }) {
    const info = this._insert.run({ title, completed: completed ? 1 : 0 });
    return this.get(info.lastInsertRowid);
  }

  /**
   * Full or partial update. Fields left undefined keep their current value.
   * Returns the updated todo, or null if the id does not exist.
   */
  update(id, { title, completed }) {
    const existing = this._byId.get(id);
    if (!existing) return null;

    const next = {
      id,
      title: title === undefined ? existing.title : title,
      completed:
        completed === undefined ? existing.completed : completed ? 1 : 0,
    };
    this._update.run(next);
    return this.get(id);
  }

  remove(id) {
    return this._delete.run(id).changes > 0;
  }
}

function toApi(row) {
  return {
    id: row.id,
    title: row.title,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = { TodoStore };
