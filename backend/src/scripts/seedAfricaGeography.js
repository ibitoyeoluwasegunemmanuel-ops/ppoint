import pool from '../config/database.js';
import { africaSeedData } from '../data/africaGeography.js';

const chunkArray = (items, size) => {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const buildValuesClause = (rows, columnCount, offset = 1) => rows
  .map((_, rowIndex) => `(${Array.from({ length: columnCount }, (_, columnIndex) => `$${offset + (rowIndex * columnCount) + columnIndex}`).join(', ')})`)
  .join(', ');

export const seedAfricaGeography = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const continentResult = await client.query(
      `INSERT INTO continents (name, code)
       VALUES ($1, $2)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [africaSeedData.continent.name, africaSeedData.continent.code]
    );

    const continentId = continentResult.rows[0].id;

    for (const chunk of chunkArray(africaSeedData.countries, 100)) {
      const values = [];
      chunk.forEach((country) => {
        values.push(
          continentId,
          country.country_name,
          country.country_code,
          country.name,
          country.code,
          country.is_active,
          country.created_at
        );
      });

      await client.query(
        `INSERT INTO countries (continent_id, country_name, country_code, name, code, is_active, created_at)
         VALUES ${buildValuesClause(chunk, 7)}
         ON CONFLICT (country_code) DO UPDATE SET
           continent_id = EXCLUDED.continent_id,
           country_name = EXCLUDED.country_name,
           name = EXCLUDED.name,
           code = EXCLUDED.code,
           is_active = EXCLUDED.is_active`,
        values
      );
    }

    const countryRows = (await client.query('SELECT id, country_code FROM countries')).rows;
    const countryIdByCode = new Map(countryRows.map((row) => [row.country_code, row.id]));
    const countryCodeBySeedId = new Map(africaSeedData.countries.map((country) => [country.id, country.country_code]));

    for (const chunk of chunkArray(africaSeedData.states, 300)) {
      const values = [];
      chunk.forEach((state) => {
        values.push(
          countryIdByCode.get(countryCodeBySeedId.get(state.country_id)),
          state.state_name,
          state.state_code,
          state.is_active
        );
      });

      await client.query(
        `INSERT INTO states (country_id, state_name, state_code, is_active)
         VALUES ${buildValuesClause(chunk, 4)}
         ON CONFLICT (country_id, state_code) DO UPDATE SET
           state_name = EXCLUDED.state_name,
           is_active = EXCLUDED.is_active`,
        values
      );
    }

    const stateRows = (await client.query('SELECT id, state_code FROM states')).rows;
    const stateIdByCode = new Map(stateRows.map((row) => [row.state_code, row.id]));
    const stateCodeBySeedId = new Map(africaSeedData.states.map((state) => [state.id, state.state_code]));

    for (const chunk of chunkArray(africaSeedData.cities, 500)) {
      const values = [];
      chunk.forEach((city) => {
        const stateCode = stateCodeBySeedId.get(city.state_id);
        const countryCode = countryCodeBySeedId.get(city.country_id);
        values.push(
          stateIdByCode.get(stateCode),
          countryIdByCode.get(countryCode),
          city.city_name,
          city.city_code,
          city.min_latitude,
          city.max_latitude,
          city.min_longitude,
          city.max_longitude,
          city.is_active,
          city.created_at
        );
      });

      await client.query(
        `INSERT INTO cities (
           state_id,
           country_id,
           city_name,
           city_code,
           min_latitude,
           max_latitude,
           min_longitude,
           max_longitude,
           boundary,
           is_active,
           created_at
         )
         VALUES ${chunk.map((_, rowIndex) => `($${1 + (rowIndex * 10)}, $${2 + (rowIndex * 10)}, $${3 + (rowIndex * 10)}, $${4 + (rowIndex * 10)}, $${5 + (rowIndex * 10)}, $${6 + (rowIndex * 10)}, $${7 + (rowIndex * 10)}, $${8 + (rowIndex * 10)}, NULL, $${9 + (rowIndex * 10)}, $${10 + (rowIndex * 10)})`).join(', ')}
         ON CONFLICT (city_code) DO UPDATE SET
           state_id = EXCLUDED.state_id,
           country_id = EXCLUDED.country_id,
           city_name = EXCLUDED.city_name,
           min_latitude = EXCLUDED.min_latitude,
           max_latitude = EXCLUDED.max_latitude,
           min_longitude = EXCLUDED.min_longitude,
           max_longitude = EXCLUDED.max_longitude,
           is_active = EXCLUDED.is_active`,
        values
      );
    }

    await client.query('COMMIT');
    console.log(`Africa geography seeded: ${africaSeedData.countries.length} countries, ${africaSeedData.states.length} states, ${africaSeedData.cities.length} cities`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};