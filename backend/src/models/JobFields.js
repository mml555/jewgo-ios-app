const { query } = require('../database/connection');

class JobFields {
  static async findByEntityId(entityId) {
    const sql = `
      SELECT * FROM job_fields 
      WHERE entity_id = $1
    `;
    const result = await query(sql, [entityId]);
    return result.rows[0];
  }

  static async create(data) {
    const {
      entityId,
      jobType,
      jobIndustry,
      experienceLevel,
      salaryMin,
      salaryMax,
      employmentType,
      applicationDeadline,
      employerId,
    } = data;

    const sql = `
      INSERT INTO job_fields (
        entity_id, job_type, job_industry, experience_level, salary_min,
        salary_max, employment_type, application_deadline, employer_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      entityId,
      jobType,
      jobIndustry,
      experienceLevel,
      salaryMin,
      salaryMax,
      employmentType,
      applicationDeadline,
      employerId,
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  static async update(entityId, data) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        paramCount++;
        fields.push(`${key} = $${paramCount}`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    paramCount++;
    values.push(entityId);

    const sql = `
      UPDATE job_fields 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE entity_id = $${paramCount}
      RETURNING *
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  static async delete(entityId) {
    const sql = `
      DELETE FROM job_fields 
      WHERE entity_id = $1
    `;
    const result = await query(sql, [entityId]);
    return result.rowCount > 0;
  }
}

module.exports = JobFields;
