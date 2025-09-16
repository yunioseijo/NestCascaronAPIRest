<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ yarn install
```

## Compile and run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Seeding

The project includes a simple seed to create the initial admin user.

- Endpoint: `POST /api/seed`
- Header: `x-seed-secret: <your SEED_SECRET>`
- Env vars (see `.env.template`): `SEED_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`

Run via script (dev only):

```bash
yarn seed
```

Example using curl (local dev):

```bash
curl -X POST http://localhost:3000/api/seed \
  -H "x-seed-secret: dev-seed"
```

Behavior:
- If no user exists with `ADMIN_EMAIL`, it creates one with roles `admin`, `super-user`, `user`, `isActive: true`, and `emailVerified: true`.
- If it already exists, it returns the existing admin’s id/email/roles.

Security notes:
- Change `SEED_SECRET` before running in any shared or production environment.
- Consider removing or disabling the Seed module after initialization in production.
- The `yarn seed` script refuses to run unless `STAGE=dev`.

## CORS

- Env var: `CORS_ORIGIN` (comma-separated for multiple), default `http://localhost:4200`.
- The app enables CORS at bootstrap with `credentials: true` and common headers.
- For Angular dev at `http://localhost:4200`, no extra setup is needed beyond `CORS_ORIGIN`.
- If your frontend uses cookies (`withCredentials: true`), keep `CORS_ORIGIN` as a specific origin (not `*`).

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

### Railway (Dockerfile or Nixpacks)

This project ships with a multi-stage Dockerfile suitable for production. On Railway you can deploy using either:

- Dockerfile (recommended): Railway builds the container defined by `Dockerfile` and runs `npm run start:prod`.
- Nixpacks (Node): Railway detects Node, runs `npm ci && npm run build`, then `npm run start:prod`.

Create a managed PostgreSQL service in Railway and then set the following environment variables on the API service:

- Using discrete variables (private networking):
  - `STAGE=prod`
  - `DB_HOST=${PGHOST}`
  - `DB_PORT=${PGPORT}` (usually 5432)
  - `DB_NAME=${PGDATABASE}`
  - `DB_USERNAME=${PGUSER}`
  - `DB_PASSWORD=${PGPASSWORD}`
  - `DB_SSL=false` (private host does not require SSL)

- Using a single connection string:
  - `DATABASE_URL` (e.g. `postgresql://user:pass@host:5432/dbname`)
  - `DB_SSL=true` if your provider requires SSL (e.g. public TCP proxy)

Other recommended variables:

- `JWT_SECRET`
- `CORS_ORIGIN` (comma-separated list of allowed origins)
- Optional: `APP_WEB_URL`, `SEED_SECRET` (for one-time seeding)

Notes:

- The app respects `process.env.PORT` (Railway injects it). Do not hardcode `PORT` in Railway.
- SSL is controlled by `DB_SSL` (default: `STAGE === 'prod'`). When set, TypeORM uses `rejectUnauthorized: false` in the driver options for compatibility.
- With `synchronize: true`, TypeORM updates the schema automatically. For production-grade flows, consider using migrations.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
