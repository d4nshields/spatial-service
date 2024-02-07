"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = 3000; // or any port you prefer
// PostgreSQL connection pool
const pool = new pg_1.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});
app.use(express_1.default.json());
app.get('/get_boundary_info', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { lat, lon, clientapp } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: "Missing latitude or longitude parameter" });
    }
    if (clientapp !== process.env.CLIENT_APP_TOKEN) {
        return res.status(403).json({ error: "Unauthorized client application" });
    }
    try {
        // First, find the state or province the point is in
        const locationQueryResult = yield pool.query(`SELECT name, iso_3166_2 FROM ne_50m_admin_1_states_provinces WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))`, [lon, lat]);
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
        const distanceQueryResult = yield pool.query(distanceQuery, queryParams);
        const { distance_meters } = distanceQueryResult.rows[0];
        res.json({
            name: name,
            iso_3166_2: iso_3166_2,
            distance_to_border_meters: distance_meters
        });
    }
    catch (error) {
        console.error('Query error', error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}));
app.listen(port, () => {
    console.log(`Spatial service running at http://localhost:${port}`);
});
