const { query } = require('../database/connection');

class EventFields {
  static async findByEntityId(entityId) {
    const sql = `
      SELECT * FROM event_fields 
      WHERE entity_id = $1
    `;
    const result = await query(sql, [entityId]);
    return result.rows[0];
  }

  static async create(data) {
    const {
      entityId,
      eventType,
      startTime,
      endTime,
      capacity,
      registrationRequired,
      cost,
      organizerId,
    } = data;

    const sql = `
      INSERT INTO event_fields (
        entity_id, event_type, start_time, end_time, capacity,
        registration_required, cost, organizer_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      entityId,
      eventType,
      startTime,
      endTime,
      capacity,
      registrationRequired,
      cost,
      organizerId,
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
      UPDATE event_fields 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE entity_id = $${paramCount}
      RETURNING *
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  static async delete(entityId) {
    const sql = `
      DELETE FROM event_fields 
      WHERE entity_id = $1
    `;
    const result = await query(sql, [entityId]);
    return result.rowCount > 0;
  }
}

module.exports = EventFields;
