const { Pool } = require('pg');

class RBACService {
  constructor(dbPool) {
    this.db = dbPool;
  }

  // ==============================================
  // USER PERMISSIONS
  // ==============================================

  async getUserPermissions(userId) {
    const result = await this.db.query(
      `SELECT DISTINCT p.name, p.resource
       FROM user_role_bindings urb
       JOIN role_permissions rp ON urb.role_id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE urb.user_id = $1
         AND (urb.expires_at IS NULL OR urb.expires_at > NOW())`,
      [userId]
    );
    
    return result.rows;
  }

  async userHasPermission(userId, permission, resource = null) {
    const result = await this.db.query(
      `SELECT user_has_permission($1, $2, $3) as has_permission`,
      [userId, permission, resource]
    );
    
    return result.rows[0].has_permission;
  }

  async getUserRoles(userId) {
    const result = await this.db.query(`
      SELECT r.name, r.description, urb.scope, urb.expires_at
      FROM user_role_bindings urb
      JOIN roles r ON urb.role_id = r.id
      WHERE urb.user_id = $1
        AND (urb.expires_at IS NULL OR urb.expires_at > NOW())
      ORDER BY r.name
    `, [userId]);
    
    return result.rows;
  }

  // ==============================================
  // ROLE MANAGEMENT
  // ==============================================

  async createRole(roleData) {
    const { name, description, permissions = [] } = roleData;
    
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      
      // Create role
      const roleResult = await client.query(`
        INSERT INTO roles (name, description)
        VALUES ($1, $2)
        RETURNING id, name, description, created_at
      `, [name, description]);
      
      const role = roleResult.rows[0];
      
      // Assign permissions if provided
      if (permissions.length > 0) {
        await this.assignPermissionsToRole(role.id, permissions, client);
      }
      
      await client.query('COMMIT');
      
      return {
        ...role,
        permissions
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateRole(roleId, roleData) {
    const { name, description } = roleData;
    
    const result = await this.db.query(`
      UPDATE roles 
      SET name = $1, description = $2, updated_at = NOW(), version = version + 1
      WHERE id = $3 AND is_system = FALSE
      RETURNING id, name, description, updated_at, version
    `, [name, description, roleId]);
    
    if (result.rows.length === 0) {
      throw new Error('Role not found or is a system role');
    }
    
    return result.rows[0];
  }

  async deleteRole(roleId) {
    const result = await this.db.query(`
      DELETE FROM roles 
      WHERE id = $1 AND is_system = FALSE
      RETURNING id, name
    `, [roleId]);
    
    if (result.rows.length === 0) {
      throw new Error('Role not found or is a system role');
    }
    
    return result.rows[0];
  }

  async getRole(roleId) {
    const result = await this.db.query(`
      SELECT r.id, r.name, r.description, r.is_system, r.created_at, r.updated_at,
             COALESCE(array_agg(p.name ORDER BY p.name), '{}') as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE r.id = $1
      GROUP BY r.id, r.name, r.description, r.is_system, r.created_at, r.updated_at
    `, [roleId]);
    
    return result.rows[0] || null;
  }

  async getAllRoles() {
    const result = await this.db.query(`
      SELECT r.id, r.name, r.description, r.is_system, r.created_at, r.updated_at,
             COALESCE(array_agg(p.name ORDER BY p.name), '{}') as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      GROUP BY r.id, r.name, r.description, r.is_system, r.created_at, r.updated_at
      ORDER BY r.name
    `);
    
    return result.rows;
  }

  // ==============================================
  // PERMISSION MANAGEMENT
  // ==============================================

  async createPermission(permissionData) {
    const { name, description, resource } = permissionData;
    
    const result = await this.db.query(`
      INSERT INTO permissions (name, description, resource)
      VALUES ($1, $2, $3)
      RETURNING id, name, description, resource, created_at
    `, [name, description, resource]);
    
    return result.rows[0];
  }

  async getAllPermissions() {
    const result = await this.db.query(`
      SELECT id, name, description, resource, created_at
      FROM permissions
      ORDER BY name
    `);
    
    return result.rows;
  }

  async assignPermissionsToRole(roleId, permissionNames, client = null) {
    const dbClient = client || await this.db.connect();
    
    try {
      // Get permission IDs
      const permissionResult = await dbClient.query(`
        SELECT id FROM permissions WHERE name = ANY($1)
      `, [permissionNames]);
      
      const permissionIds = permissionResult.rows.map(row => row.id);
      
      if (permissionIds.length !== permissionNames.length) {
        const foundNames = permissionResult.rows.map(row => row.name);
        const missing = permissionNames.filter(name => !foundNames.includes(name));
        throw new Error(`Permissions not found: ${missing.join(', ')}`);
      }
      
      // Insert role-permission mappings
      const values = permissionIds.map(pid => `('${roleId}', '${pid}')`).join(',');
      await dbClient.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ${values}
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `);
      
    } finally {
      if (!client) {
        dbClient.release();
      }
    }
  }

  async removePermissionsFromRole(roleId, permissionNames, client = null) {
    const dbClient = client || await this.db.connect();
    
    try {
      await dbClient.query(`
        DELETE FROM role_permissions 
        WHERE role_id = $1 
          AND permission_id IN (
            SELECT id FROM permissions WHERE name = ANY($2)
          )
      `, [roleId, permissionNames]);
    } finally {
      if (!client) {
        dbClient.release();
      }
    }
  }

  // ==============================================
  // USER ROLE ASSIGNMENTS
  // ==============================================

  async assignRoleToUser(userId, roleName, scope = null, expiresAt = null, assignedBy = null) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      
      // Get role ID
      const roleResult = await client.query(
        'SELECT id FROM roles WHERE name = $1',
        [roleName]
      );
      
      if (roleResult.rows.length === 0) {
        throw new Error(`Role not found: ${roleName}`);
      }
      
      const roleId = roleResult.rows[0].id;
      
      // Check if assignment already exists
      const existingResult = await client.query(`
        SELECT id FROM user_role_bindings 
        WHERE user_id = $1 AND role_id = $2 AND scope = $3
          AND (expires_at IS NULL OR expires_at > NOW())
      `, [userId, roleId, scope]);
      
      if (existingResult.rows.length > 0) {
        throw new Error('User already has this role assignment');
      }
      
      // Create assignment
      const result = await client.query(`
        INSERT INTO user_role_bindings (user_id, role_id, scope, expires_at, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, role_id, scope, expires_at, created_at
      `, [userId, roleId, scope, expiresAt, assignedBy]);
      
      await client.query('COMMIT');
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async removeRoleFromUser(userId, roleName, scope = null) {
    const result = await this.db.query(`
      DELETE FROM user_role_bindings 
      WHERE user_id = $1 
        AND role_id = (SELECT id FROM roles WHERE name = $2)
        AND scope = $3
      RETURNING id, role_id, scope
    `, [userId, roleName, scope]);
    
    return result.rows[0] || null;
  }

  async getUserRoleAssignments(userId) {
    const result = await this.db.query(`
      SELECT urb.id, r.name as role_name, r.description, urb.scope, 
             urb.expires_at, urb.created_at, urb.created_by,
             u.primary_email as assigned_by_email
      FROM user_role_bindings urb
      JOIN roles r ON urb.role_id = r.id
      LEFT JOIN users u ON urb.created_by = u.id
      WHERE urb.user_id = $1
      ORDER BY r.name, urb.created_at DESC
    `, [userId]);
    
    return result.rows;
  }

  // ==============================================
  // PERMISSION CHECKING HELPERS
  // ==============================================

  async checkEntityPermission(userId, permission, entityId = null) {
    const hasGlobalPermission = await this.userHasPermission(userId, permission);
    
    if (hasGlobalPermission) {
      return true;
    }
    
    // Check resource-specific permissions
    if (entityId) {
      const hasResourcePermission = await this.userHasPermission(userId, permission, 'entity');
      if (hasResourcePermission) {
        // Additional check: is user the owner of the entity?
        if (permission.includes('own')) {
          const entityResult = await this.db.query(
            'SELECT owner_id FROM entities WHERE id = $1',
            [entityId]
          );
          
          if (entityResult.rows.length > 0) {
            return entityResult.rows[0].owner_id === userId;
          }
        }
        return true;
      }
    }
    
    return false;
  }

  async checkReviewPermission(userId, permission, reviewId = null) {
    const hasGlobalPermission = await this.userHasPermission(userId, permission);
    
    if (hasGlobalPermission) {
      return true;
    }
    
    // Check resource-specific permissions
    if (reviewId) {
      const hasResourcePermission = await this.userHasPermission(userId, permission, 'review');
      if (hasResourcePermission) {
        // Additional check: is user the owner of the review?
        if (permission.includes('own')) {
          const reviewResult = await this.db.query(
            'SELECT user_id FROM reviews WHERE id = $1',
            [reviewId]
          );
          
          if (reviewResult.rows.length > 0) {
            return reviewResult.rows[0].user_id === userId;
          }
        }
        return true;
      }
    }
    
    return false;
  }

  // ==============================================
  // ADMIN FUNCTIONS
  // ==============================================

  async getRoleStats() {
    const result = await this.db.query(`
      SELECT r.name, r.description, 
             COUNT(urb.user_id) as user_count,
             array_agg(DISTINCT p.name ORDER BY p.name) as permissions
      FROM roles r
      LEFT JOIN user_role_bindings urb ON r.id = urb.role_id 
        AND (urb.expires_at IS NULL OR urb.expires_at > NOW())
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      GROUP BY r.id, r.name, r.description
      ORDER BY r.name
    `);
    
    return result.rows;
  }

  async getPermissionUsage() {
    const result = await this.db.query(`
      SELECT p.name, p.resource, COUNT(DISTINCT urb.user_id) as user_count
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN user_role_bindings urb ON rp.role_id = urb.role_id
        AND (urb.expires_at IS NULL OR urb.expires_at > NOW())
      GROUP BY p.id, p.name, p.resource
      ORDER BY user_count DESC, p.name
    `);
    
    return result.rows;
  }

  async auditRoleChanges(userId, action, details) {
    // This would integrate with your audit logging system
    console.log(`RBAC Audit: User ${userId} ${action}`, details);
  }
}

module.exports = RBACService;
