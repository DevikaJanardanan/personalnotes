/**
 * API tests – run with:  npm test
 * Uses an in-memory MongoDB, so no database setup is needed.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');

let mongo;
let tokenA;
let tokenB;

const auth = (token) => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  const a = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Alice', email: 'alice@test.com', password: 'secret123' });
  tokenA = a.body.token;

  const b = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Bob', email: 'bob@test.com', password: 'secret123' });
  tokenB = b.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Auth', () => {
  test('register returns a token and the user (without password)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Carol', email: 'carol@test.com', password: 'secret123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('carol@test.com');
    expect(res.body.user.password).toBeUndefined();
  });

  test('duplicate email is rejected with 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice 2', email: 'ALICE@test.com', password: 'secret123' });
    expect(res.status).toBe(409);
  });

  test('invalid registration data returns field errors', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'bad', password: '1' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.details)).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  test('login works with correct password and fails with wrong one', async () => {
    const ok = await request(app).post('/api/auth/login').send({ email: 'alice@test.com', password: 'secret123' });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeDefined();

    const bad = await request(app).post('/api/auth/login').send({ email: 'alice@test.com', password: 'nope' });
    expect(bad.status).toBe(401);
  });

  test('GET /api/auth/me returns the current user', async () => {
    const res = await request(app).get('/api/auth/me').set(auth(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Alice');
  });
});

describe('Protected routes', () => {
  test('notes require a token', async () => {
    expect((await request(app).get('/api/notes')).status).toBe(401);
    expect((await request(app).get('/api/notes').set(auth('garbage'))).status).toBe(401);
  });
});

describe('Notes CRUD', () => {
  let noteId;

  test('POST /api/notes creates a note with timestamps', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set(auth(tokenA))
      .send({ title: 'Shopping list', content: 'Milk, eggs', tags: ['Home', '#errands', 'home'], pinned: true });
    expect(res.status).toBe(201);
    expect(res.body.note).toMatchObject({ title: 'Shopping list', pinned: true, tags: ['home', 'errands'] });
    expect(res.body.note.createdAt).toBeDefined();
    expect(res.body.note.updatedAt).toBeDefined();
    noteId = res.body.note.id;
  });

  test('POST validates the body', async () => {
    const res = await request(app).post('/api/notes').set(auth(tokenA)).send({ title: '', pinned: 'yes' });
    expect(res.status).toBe(400);
    expect(res.body.details).toHaveProperty('title');
    expect(res.body.details).toHaveProperty('pinned');
  });

  test('GET /api/notes lists only the user\'s notes, pinned first', async () => {
    await request(app).post('/api/notes').set(auth(tokenA)).send({ title: 'Lecture notes', content: 'React hooks', tags: ['study'] });
    const res = await request(app).get('/api/notes').set(auth(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.notes[0].pinned).toBe(true);

    const other = await request(app).get('/api/notes').set(auth(tokenB));
    expect(other.body.count).toBe(0);
  });

  test('search and tag filters work', async () => {
    const s = await request(app).get('/api/notes?search=hooks').set(auth(tokenA));
    expect(s.body.notes.map((n) => n.title)).toEqual(['Lecture notes']);

    const t = await request(app).get('/api/notes?tag=errands').set(auth(tokenA));
    expect(t.body.notes.map((n) => n.title)).toEqual(['Shopping list']);

    const special = await request(app).get('/api/notes?search=' + encodeURIComponent('(.*')).set(auth(tokenA));
    expect(special.status).toBe(200);
  });

  test('PUT /api/notes/:id updates and returns the note', async () => {
    await new Promise((r) => setTimeout(r, 20));
    const res = await request(app)
      .put(`/api/notes/${noteId}`)
      .set(auth(tokenA))
      .send({ title: 'Groceries', pinned: false, user: 'hacker' });
    expect(res.status).toBe(200);
    expect(res.body.note.title).toBe('Groceries');
    expect(res.body.note.pinned).toBe(false);
    expect(new Date(res.body.note.editedAt) > new Date(res.body.note.createdAt)).toBe(true);
  });

  test('another user cannot read, update or delete the note', async () => {
    expect((await request(app).get(`/api/notes/${noteId}`).set(auth(tokenB))).status).toBe(404);
    expect((await request(app).put(`/api/notes/${noteId}`).set(auth(tokenB)).send({ title: 'x' })).status).toBe(404);
    expect((await request(app).delete(`/api/notes/${noteId}`).set(auth(tokenB))).status).toBe(404);
  });

  test('pin toggle does not count as an edit', async () => {
    const before = (await request(app).get(`/api/notes/${noteId}`).set(auth(tokenA))).body.note;
    const pin = await request(app).patch(`/api/notes/${noteId}/pin`).set(auth(tokenA));
    expect(pin.body.note.pinned).toBe(true);
    expect(pin.body.note.editedAt).toBe(before.editedAt);
  });

  test('stats are calculated per user', async () => {
    const res = await request(app).get('/api/notes/stats').set(auth(tokenA));
    expect(res.body.stats).toMatchObject({ total: 2, pinned: 1, locked: 0 });
    const other = await request(app).get('/api/notes/stats').set(auth(tokenB));
    expect(other.body.stats.total).toBe(0);
  });

  test('DELETE /api/notes/:id removes the note', async () => {
    const res = await request(app).delete(`/api/notes/${noteId}`).set(auth(tokenA));
    expect(res.status).toBe(200);
    expect((await request(app).get(`/api/notes/${noteId}`).set(auth(tokenA))).status).toBe(404);
  });

  test('invalid ids return 404, unknown routes return 404', async () => {
    expect((await request(app).get('/api/notes/not-an-id').set(auth(tokenA))).status).toBe(404);
    expect((await request(app).get('/api/nothing')).status).toBe(404);
  });
});

describe('Locked notes', () => {
  let lockedId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/notes')
      .set(auth(tokenA))
      .send({ title: 'Bank PIN hint', content: 'Top secret content', tags: ['private'] });
    lockedId = res.body.note.id;
  });

  test('cannot lock a note before a lock password is set', async () => {
    const res = await request(app).patch(`/api/notes/${lockedId}/lock`).set(auth(tokenA));
    expect(res.status).toBe(400);
  });

  test('set the lock password (min 4 chars), change needs the current one', async () => {
    expect((await request(app).put('/api/auth/lock-password').set(auth(tokenA)).send({ newPassword: '12' })).status).toBe(400);

    const set = await request(app).put('/api/auth/lock-password').set(auth(tokenA)).send({ newPassword: '1234' });
    expect(set.status).toBe(200);
    expect(set.body.user.hasLockPassword).toBe(true);

    const wrong = await request(app)
      .put('/api/auth/lock-password')
      .set(auth(tokenA))
      .send({ currentPassword: '0000', newPassword: '5678' });
    expect(wrong.status).toBe(403);

    const ok = await request(app)
      .put('/api/auth/lock-password')
      .set(auth(tokenA))
      .send({ currentPassword: '1234', newPassword: 'abcd' });
    expect(ok.status).toBe(200);
  });

  test('locked notes hide their content, tags and are not searchable by content', async () => {
    const lock = await request(app).patch(`/api/notes/${lockedId}/lock`).set(auth(tokenA));
    expect(lock.body.note.locked).toBe(true);
    expect(lock.body.note.content).toBe('');

    const list = await request(app).get('/api/notes?locked=true').set(auth(tokenA));
    expect(list.body.count).toBe(1);
    expect(list.body.notes[0]).toMatchObject({ title: 'Bank PIN hint', content: '', tags: [] });

    const search = await request(app).get('/api/notes?search=secret').set(auth(tokenA));
    expect(search.body.count).toBe(0);
    const byTitle = await request(app).get('/api/notes?search=bank').set(auth(tokenA));
    expect(byTitle.body.count).toBe(1);

    const stats = await request(app).get('/api/notes/stats').set(auth(tokenA));
    expect(stats.body.stats.locked).toBe(1);
    expect(stats.body.stats.tags.find((t) => t.tag === 'private')).toBeUndefined();
  });

  test('unlock needs the right password', async () => {
    const bad = await request(app).post(`/api/notes/${lockedId}/unlock`).set(auth(tokenA)).send({ password: 'nope' });
    expect(bad.status).toBe(403);
    const ok = await request(app).post(`/api/notes/${lockedId}/unlock`).set(auth(tokenA)).send({ password: 'abcd' });
    expect(ok.status).toBe(200);
    expect(ok.body.note.content).toBe('Top secret content');
  });

  test('editing or deleting a locked note needs the X-Lock-Password header', async () => {
    expect((await request(app).put(`/api/notes/${lockedId}`).set(auth(tokenA)).send({ content: 'x' })).status).toBe(403);
    const ok = await request(app)
      .put(`/api/notes/${lockedId}`)
      .set(auth(tokenA))
      .set('X-Lock-Password', 'abcd')
      .send({ content: 'Updated secret' });
    expect(ok.status).toBe(200);
    expect(ok.body.note.content).toBe('Updated secret');

    expect((await request(app).delete(`/api/notes/${lockedId}`).set(auth(tokenA))).status).toBe(403);
  });

  test('another user cannot unlock the note', async () => {
    const res = await request(app).post(`/api/notes/${lockedId}/unlock`).set(auth(tokenB)).send({ password: 'abcd' });
    expect(res.status).toBe(404);
  });

  test('removing the lock needs the password', async () => {
    expect((await request(app).patch(`/api/notes/${lockedId}/lock`).set(auth(tokenA)).send({ password: 'x' })).status).toBe(403);
    const res = await request(app).patch(`/api/notes/${lockedId}/lock`).set(auth(tokenA)).send({ password: 'abcd' });
    expect(res.body.note.locked).toBe(false);
    expect(res.body.note.content).toBe('Updated secret');
  });
});
