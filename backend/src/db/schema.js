import { query } from './db.js'

/**
 * Initialize database tables
 */
export const initializeDatabase = async () => {
  try {
    console.log('💾 Initializing database...')

    // Create extensions
    await query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Projects table
    await query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Files table
    await query(`
      CREATE TABLE IF NOT EXISTS files (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        file_type VARCHAR(50),
        file_size INTEGER,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Processing jobs table
    await query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        file_id UUID REFERENCES files(id),
        job_id VARCHAR(255) UNIQUE,
        status VARCHAR(50) DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        result JSONB,
        error_message TEXT,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Layouts table (customizations made in editor)
    await query(`
      CREATE TABLE IF NOT EXISTS layouts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        layout_data JSONB NOT NULL,
        version INTEGER DEFAULT 1,
        saved_by UUID REFERENCES users(id),
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create indexes for better performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)
    `)

    await query(`
      CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id)
    `)

    await query(`
      CREATE INDEX IF NOT EXISTS idx_jobs_project_id ON jobs(project_id)
    `)

    await query(`
      CREATE INDEX IF NOT EXISTS idx_layouts_project_id ON layouts(project_id)
    `)

    console.log('✅ Database initialized successfully')
    return true
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

/**
 * Drop all tables (for testing)
 */
export const dropAllTables = async () => {
  try {
    await query('DROP TABLE IF EXISTS layouts CASCADE')
    await query('DROP TABLE IF EXISTS jobs CASCADE')
    await query('DROP TABLE IF EXISTS files CASCADE')
    await query('DROP TABLE IF EXISTS projects CASCADE')
    await query('DROP TABLE IF EXISTS users CASCADE')
    console.log('✅ All tables dropped')
  } catch (error) {
    console.error('❌ Error dropping tables:', error)
    throw error
  }
}
