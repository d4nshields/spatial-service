# My Spatial Service

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
3. Set up your PostgreSQL database and import the `boundaries` data from the `data/` directory.    For this to work you should have a postgres user set up called 'geo' with required grants for access to the 'boundaries' schema.
```bash
pg_restore -U geo -d boundaries -1 data/boundaries.dump
```
4. Copy `.env.example` to `.env` and update it with your database credentials and application token.
5. Run the service:
```bash
npm start
```

## API Usage

**Endpoint**: `/get_boundary_info?lat=<LATITUDE>&lon=<LONGITUDE>&clientapp=<TOKEN>`

Replace `<LATITUDE>`, `<LONGITUDE>`, and `<TOKEN>` with actual values.

## License

[ISC](./LICENSE)
