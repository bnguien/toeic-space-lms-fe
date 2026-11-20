# TOEICSpace LMS Frontend

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/REACT-20232A?style=for-the-badge&amp;logo=react&amp;logoColor=61DAFB" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TYPESCRIPT-007ACC?style=for-the-badge&amp;logo=typescript&amp;logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/VITE-646CFF?style=for-the-badge&amp;logo=vite&amp;logoColor=FFD62E" />
</p>

TOEICSpace LMS helps TOEIC training centers manage classes from enrollment through attendance and tuition collection. Administrators, teachers, and students sign in to dedicated portals for their daily work.

## Key Features

- **Class administration** — Assign teachers and rooms, enroll students, and manage recurring schedules. Preview scheduling conflicts before saving changes.
- **Teaching and attendance** — Teachers can review assigned classes, take attendance, and manage Google Meet links for online sessions.
- **Student portal** — Students can view their enrolled classes, weekly calendar, meeting links, and attendance history.
- **Tuition tracking** — Administrators can create tuition orders, record cash payments and waivers, and look up statements showing payments and the outstanding balance.
- **Account management** — Register, verify an email address, update a profile, or recover a password.

## Technology Stack

- **Language and framework** — TypeScript and React, with Vite for development and production builds.
- **Routing and data fetching** — React Router, TanStack Query, and Axios.
- **Forms and validation** — React Hook Form and Zod.
- **Database** — The LMS backend owns data storage. The frontend accesses it through the API gateway.

## Requirements

- Node.js 22.x and npm 10.x.
- A running `toeic-space-lms-be` gateway for sign-in and LMS operations. The default local gateway address is `http://127.0.0.1:15050`.

## Installation and Setup

```bash
git clone https://github.com/bnguien/toeic-space-lms-fe.git
cd toeic-space-lms-fe
npm ci
cp .env.example .env.local
npm run dev
```

Open [the local LMS](http://127.0.0.1:15173) and sign in with an account from your LMS backend.

## Usage

| Role          | Default portal | Typical task                                                     |
| ------------- | -------------- | ---------------------------------------------------------------- |
| Administrator | `/admin`       | Enroll a student, schedule a class, or record a tuition payment. |
| Teacher       | `/teacher`     | Open an assigned class and mark attendance for a session.        |
| Student       | `/my-classes`  | Check the weekly schedule or join an online session.             |

The defaults work with the local gateway. Set these optional variables in `.env.local` when your environment differs.

| Variable                | Purpose                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| `VITE_LMS_GATEWAY`      | Sets the backend address used by the Vite development proxy. Defaults to `http://127.0.0.1:15050`. |
| `VITE_LMS_API_BASE_URL` | Sets the API origin used by the browser. Leave empty to send requests through the frontend origin. |
| `VITE_AVATAR_CDN_URL`   | Sets the public CDN origin for profile images if your deployment uses one.                         |

Run the same checks used in CI before submitting a change:

```bash
npm run lint
npm run typecheck
npm run format:check
npm test
npm run build
```

For production, serve `dist/` on the LMS hostname. Forward `/identity`, `/classroom`, `/assessment`, `/content`, and `/payment` to the LMS gateway before applying the SPA fallback to `index.html`. This lets API requests reach the backend and portal links open correctly on refresh.

## Directory Structure

```text
├── .github/workflows/   # CI and deployment
├── public/              # Static files served as-is
├── src/
│   ├── app/             # Application routes and root layout
│   ├── assets/          # Images and other bundled assets
│   ├── config/          # Frontend environment settings
│   ├── modules/         # Role portals, authentication, tuition, and other features
│   ├── services/        # Shared service clients
│   ├── shared/          # Reusable components, layouts, hooks, and types
│   └── styles/          # Global styles
├── tests/               # Automated frontend tests
├── vite.config.ts       # Vite server, proxy, and build configuration
├── LICENSE
└── README.md
```

## Authors and License

- **Authors** — TOEICSpace Contributors
- **License** — [MIT](LICENSE)
