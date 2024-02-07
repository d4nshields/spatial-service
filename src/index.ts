import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = 3000; // or any port you prefer

// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/get_boundary_info', async (req, res) => {
    const { lat, lon, clientapp } = req.query;

    if (!lat || !lon) {
        return res.status(400).json({ error: "Missing latitude or longitude parameter" });
    }

    if (clientapp !== process.env.CLIENT_APP_TOKEN) {
        return res.status(403).json({ error: "Unauthorized client application" });
    }

    try {
        // First, find the state or province the point is in
        const locationQueryResult = await pool.query(
            `SELECT name, iso_3166_2 FROM ne_50m_admin_1_states_provinces WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))`,
            [lon, lat]
        );

        if (locationQueryResult.rows.length === 0) {
            return res.status(404).json({ error: "Location not within any known boundary" });
        }

        const { name, iso_3166_2 } = locationQueryResult.rows[0];

        // Next, calculate the distance to the boundary of the found state or province

        const queryParams = [lon, lat, iso_3166_2];
        const distanceQuery = `
            SELECT ST_Distance(
                ST_Transform(ST_SetSRID(ST_MakePoint($1, $2), 4326), 3857),
                ST_Transform((SELECT ST_Boundary(geom) FROM ne_50m_admin_1_states_provinces WHERE iso_3166_2 = $3), 3857)
            ) AS distance_meters
            FROM ne_50m_admin_1_states_provinces
            WHERE iso_3166_2 = $3`;

        // Log the query with placeholders and the parameters array
        console.log("Executing query:", distanceQuery);
        console.log("With parameters:", queryParams);

        const distanceQueryResult = await pool.query(distanceQuery, queryParams);

        const { distance_meters } = distanceQueryResult.rows[0];

        res.json({
            name: name,
            iso_3166_2: iso_3166_2,
            distance_to_border_meters: distance_meters
        });

    } catch (error:any) {
        console.error('Query error', error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(port, () => {
    console.log(`Spatial service running at http://localhost:${port}`);
});
