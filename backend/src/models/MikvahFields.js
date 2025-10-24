const { query } = require('../database/connection');

class MikvahFields {
  static async findByEntityId(entityId) {
    const sql = `
      SELECT * FROM mikvah_fields 
      WHERE entity_id = $1
    `;
    const result = await query(sql, [entityId]);
    return result.rows[0];
  }

  static async create(data) {
    const {
      entityId,
      supervision,
      appointmentRequired,
      separateEntrances,
      accessibilityFeatures,
    } = data;

    const sql = `
      INSERT INTO mikvah_fields (
        entity_id, supervision, appointment_required, separate_entrances,
        accessibility_features
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      entityId,
      supervision,
      appointmentRequired,
      separateEntrances,
      accessibilityFeatures,
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
      UPDATE mikvah_fields 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE entity_id = $${paramCount}
      RETURNING *
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  static async delete(entityId) {
    const sql = `
      DELETE FROM mikvah_fields 
      WHERE entity_id = $1
    `;
    const result = await query(sql, [entityId]);
    return result.rowCount > 0;
  }
}

module.exports = MikvahFields;
