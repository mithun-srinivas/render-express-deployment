// A normal Express app, deployed on Render as a Web Service.
//
// This is the opposite of the Netlify folder next door. Here there IS a
// server: one Node process, in one region, that starts up and then stays
// running. That is why Express works unchanged - and why the array below
// actually holds its contents.

const express = require('express');

const app = express();

// read JSON bodies into req.body
app.use(express.json());

// Our "database": a plain array in memory.
//
// On Render this survives between requests, because it is all one
// process. It does NOT survive a restart, a redeploy, or a second
// instance if you scale up. See ../README.md §5.
const users = [
  { id: 1, name: 'Ada Lovelace' },
  { id: 2, name: 'Grace Hopper' },
];

let nextId = 3;

// GET /users - everyone
app.get('/users', (req, res) => {
  res.json(users);
});

// POST /users - add a user
app.post('/users', (req, res) => {
  const { name } = req.body;

  if (!name) return res.status(400).json({ error: 'name is required' });

  const user = { id: nextId++, name };
  users.push(user);

  res.status(201).json(user);
});

// PUT /users/:id - rename a user
app.put('/users/:id', (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));

  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  user.name = name;
  res.json(user);
});

// DELETE /users/:id
app.delete('/users/:id', (req, res) => {
  const index = users.findIndex((u) => u.id === Number(req.params.id));

  if (index === -1) return res.status(404).json({ error: 'User not found' });

  const [deleted] = users.splice(index, 1);
  res.json({ deleted });
});

// Render hands us a port in process.env.PORT and expects us to use it.
// Hard-code 3000 and the deploy will fail its health check.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Users API listening on port ${PORT}`));
