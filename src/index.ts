import express from 'express';
import cors from 'cors';
import { Client } from 'pg';
import * as ApiClient from 'kubernetes-client';
const { KubeConfig, Request } = require('kubernetes-client'); 

const backend = new Request({ kubeconfig: new KubeConfig() });

// In-cluster configuration (adjust if necessary)
backend.kubeconfig.loadFromCluster(); 

const k8sClient = new ApiClient.Client1_13({ backend, version: '1.13' });


// Define a function to load database credentials from the Secret
async function loadDatabaseCredentials() {
  const namespace = process.env.NAMESPACE || 'default'; 
  const secret = await k8sClient.api.v1.namespaces(namespace).secrets('spatial-service-db-creds').get();

  const dbUser = secret.body.data.username; // Decode if Base64-encoded
  const dbPassword = secret.body.data.password; // Decode if Base64-encoded

  // Directly connect to your PostgreSQL database
  const pool = new Client({
    user: dbUser,
    host: process.env.DB_HOST, // Ensure DB_HOST is set in your deployment
    database: process.env.DB_NAME, // Ensure DB_NAME is set in your deployment
    password: dbPassword,
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  await pool.connect(); // Establish the connection
  return pool;

}

// Call the function to load credentials and connect to the database
const spatialPool = await loadDatabaseCredentials();

const app = express();
const port = 3000; // or any port you prefer

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/get_boundary_info', async (req, res) => {
    const { lat, lon} = req.query;

    if (!lat || !lon) {
        return res.status(400).json({ error: "Missing latitude or longitude parameter" });
    }

    try {
        // First, find the state or province the point is in
        const locationQueryResult = await spatialPool.query(
            `SELECT name, iso_3166_2 FROM ne_10m_admin_1_states_provinces WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))`,
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
                ST_Transform((SELECT ST_Boundary(geom) FROM ne_10m_admin_1_states_provinces WHERE iso_3166_2 = $3), 3857)
            ) AS distance_meters
            FROM ne_10m_admin_1_states_provinces
            WHERE iso_3166_2 = $3`;

        // Log the query with placeholders and the parameters array
        console.log("Executing query:", distanceQuery);
        console.log("With parameters:", queryParams);

        const distanceQueryResult = await spatialPool.query(distanceQuery, queryParams);

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

// Read the SSL certificate files
app.listen( port, () => {
    console.log( `Spatial service running at http://localhost:${port}`);
})
