# DEMO: Spatial Service

## Description
This project provides a web service to find which state or province a given latitude and longitude is in and how far it is from the nearest border.

## Setup

### Requirements
- Node.js
- PostgreSQL with PostGIS

### Getting Started

1. Clone this repository.
2. Install dependencies:
```bash
npm install
```
3. Set up your PostgreSQL server with PostGIS extensions, create a database and import the `boundaries` data from the `data/` directory.

4. The following environment variables must be set in the environment for the server to find and connec to the PostGIS server:
```bash
export DB_USER=<your db user>
export DB_PASSWORD=<your db password>
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=boundaries
```

5. Set up a postgres user with required grants for access to the 'boundaries' schema.
```bash
gunzip data/boundaries.sql.gz
psql -U $DB_USER -d $DB_NAME -f data/boundaries.sql

```

6. Run the service:
```bash
npm start
```

## API Usage

**Endpoint**: `/get_boundary_info?lat=<LATITUDE>&lon=<LONGITUDE>&clientapp=<TOKEN>`

Replace `<LATITUDE>`, `<LONGITUDE>`, and `<TOKEN>` with actual values.

## License

[ISC](./LICENSE)
