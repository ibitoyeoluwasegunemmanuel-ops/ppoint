import pool from '../config/database.js';

async function initAgentApplicationsTable() {
  try {
    console.log('Initializing agent_applications table...');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS agent_applications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        country VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        experience INTEGER NOT NULL,
        references TEXT,
        documents JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        score INTEGER,
        applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_by VARCHAR(255),
        review_date TIMESTAMP,
        notes TEXT,
        UNIQUE(email, phone)
      );
    `;

    // Create table
    await pool.query(createTableQuery);
    console.log('✓ agent_applications table created/verified');

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_applications_status ON agent_applications(status);
    `);
    console.log('✓ Created index on status');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_applications_user_id ON agent_applications(user_id);
    `);
    console.log('✓ Created index on user_id');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_applications_country ON agent_applications(country);
    `);
    console.log('✓ Created index on country');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_applications_applied_date ON agent_applications(applied_date DESC);
    `);
    console.log('✓ Created index on applied_date');

    console.log('✓ Agent applications table initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing agent applications table:', error);
    throw error;
  }
}

export default initAgentApplicationsTable;
