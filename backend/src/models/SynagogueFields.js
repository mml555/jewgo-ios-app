const { query } = require('../database/connection');

class SynagogueFields {
  static async findByEntityId(entityId) {
    const sql = `
      SELECT * FROM synagogue_fields 
      WHERE entity_id = $1
    `;
    const result = await query(sql, [entityId]);
    return result.rows[0];
  }

  static async create(data) {
    const {
      entityId,
      denominationDetails,
      rabbiName,
      seatingCapacity,
      mechitzaType,
      mikvahOnSite,
      eruvWithin,
    } = data;

    const sql = `
      INSERT INTO synagogue_fields (
        entity_id, denomination_details, rabbi_name, seating_capacity,
        mechitza_type, mikvah_on_site, eruv_within
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      entityId,
      denominationDetails,
      rabbiName,
      seatingCapacity,
      mechitzaType,
      mikvahOnSite,
      eruvWithin,
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
      UPDATE synagogue_fields 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE entity_id = $${paramCount}
      RETURNING *
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  static async delete(entityId) {
    const sql = `
      DELETE FROM synagogue_fields 
      WHERE entity_id = $1
    `;
    const result = await query(sql, [entityId]);
    return result.rowCount > 0;
  }
}

module.exports = SynagogueFields;
