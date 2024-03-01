#!/bin/bash

set -e

# Basic setup (performed when the container starts)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE $POSTGRES_DB;
    CREATE SCHEMA geo;
    GRANT ALL ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA geo TO $POSTGRES_USER;
EOSQL

# Import data
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d "$POSTGRES_DB" < /data/geo_dump.sql 

# (Optional: Clear secrets from environment after use)
unset POSTGRES_USER POSTGRES_PASSWORD

