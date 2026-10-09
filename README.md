# Users API — Express on Render

A tiny CRUD API for a list of users, running as a **Render Web Service** —
an ordinary Node process that starts up and stays running.

Render has no edge functions; a Web Service is the right way to put Express
on Render. See §1 of the [session notes](../README.md).

```
render/
├── index.js       the whole app
└── package.json
```

## Endpoints

| Method | URL | Body | What it does |
|---|---|---|---|
| GET | `/users` | — | everyone |
| POST | `/users` | `{ "name": "Alan Turing" }` | add a user |
| PUT | `/users/:id` | `{ "name": "Alan M. Turing" }` | rename a user |
| DELETE | `/users/:id` | — | remove a user |

Errors: `400` if `name` is missing, `404` if the user does not exist.

## Run it locally

```bash
npm install
npm start
```

Then:

```bash
curl http://localhost:3000/users

curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alan Turing"}'

curl -X PUT http://localhost:3000/users/3 \
  -H "Content-Type: application/json" \
  -d '{"name":"Alan M. Turing"}'

curl -X DELETE http://localhost:3000/users/1
```

## Deploy it

1. Push this repo to GitHub.
2. Render → **New** → **Web Service** → pick the repo.
3. Set:
   - **Root directory:** `09-10-2026/render`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
4. Create. The first deploy takes a couple of minutes.

```bash
curl https://YOUR-SERVICE.onrender.com/users
```

## The one line that breaks the deploy

```js
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Users API listening on port ${PORT}`));
```

Render chooses the port and passes it in `process.env.PORT`. Hard-code `3000`
and Render's health check never gets an answer: the deploy fails with **"no
open ports detected"** even though the app runs perfectly on your laptop. The
`|| 3000` is only so local development still works.

Worth breaking on purpose once — it is the single most common first-deploy
failure, on Render, Railway and Heroku alike.

## The free tier sleeps

After 15 minutes with no traffic, Render stops the service. The next request
starts it again, which takes around 30 seconds. Try it: deploy, go for a
break, then `curl` and watch it hang.

Two things follow from that, and both are worth saying out loud:

- This is exactly the **cold start** that edge functions avoid — theirs is
  about a millisecond. Compare with §2 of the [session notes](../README.md).
- **The array resets**, because it was only ever in that process's memory.

## About the in-memory array

```js
const users = [ ... ];
```

Unlike the Netlify function next door, this **does** survive between
requests — it is one process, so it is one array. Add a user, come back an
hour later, and they are still there.

It does not survive:

- a redeploy
- a crash
- the free tier going to sleep
- scaling to two instances — each gets its own array, and the answer starts
  depending on which one you were routed to

So it is fine for a class demo and wrong for anything real. The fix is the
same as always: a database.

## Things to demo

1. The four endpoints with `curl`.
2. Add a user, then redeploy, then ask for the list again — gone.
3. Change `process.env.PORT` to a hard-coded `3000`, push, and read the failed
   deploy log together.
4. Let the service sleep, then time the first request: `time curl ...`.
