
---

## Prerequisites

- Node.js (v16+ recommended)
- PostgreSQL (v13+ recommended)
- npm or yarn

---

## Setup Instructions

### 1. Clone the Repository

```sh
git clone https://github.com/pnkj999/StackIt-A-Minimal-Q-A-Forum-Platform.git
cd stackit
```

### 2. Database Setup

- Create a PostgreSQL database (e.g., `stackit_db`).
- Create a user with privileges 
- Run all SQL migrations in `database/migrations/`:

```sh
psql -U <db_user> -d <db_name> -f database/migrations/001_create_users_table.sql
psql -U <db_user> -d <db_name> -f database/migrations/002_create_questions_table.sql
# ... repeat for all migration files in order
```

- (Optional) Seed initial data:

```sh
psql -U <db_user> -d <db_name> -f database/seeds/initial_data.sql
```

### 3. Backend Setup

```sh
cd backend
cp config/config.example.js config/config.js   # Edit with your DB credentials
npm install
npm start
```

- The backend will run on `http://localhost:5000` by default.

### 4. Frontend Setup

```sh
cd ../frontend
cp .env.example .env   # Edit API URL if needed
npm install
npm start
```

- The frontend will run on `http://localhost:3000` by default.

---

## Environment Variables

### Backend (`backend/config/config.js`)
- `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_HOST`, `JWT_SECRET`, etc.

### Frontend (`frontend/.env`)
- `REACT_APP_API_URL=http://localhost:5000`

---

## Admin Access

- Default admin user (if seeded or created):
  - **Email:** `admin@stackit.com`
  - **Password:** `admin12345`
- You can create more admins via the database or admin dashboard.

---

## Running with Docker

You can use `docker-compose.yml` for local development:

```sh
docker-compose up --build
```

---

## API Documentation

See [`docs/API.md`](docs/API.md) for detailed API endpoints and usage.

---

## Contributing

1. Fork the repo and create your branch.
2. Make your changes and add tests.
3. Submit a pull request.

---

## License

MIT

---

## Contact

For questions or support, open an issue or contact the maintainer.
