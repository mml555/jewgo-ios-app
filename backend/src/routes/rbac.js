const express = require('express');
const logger = require('../utils/logger');

function createRBACRoutes(rbacService, authMiddleware) {
  const router = express.Router();

  // All RBAC routes require admin authentication
  router.use(authMiddleware.authenticate());
  router.use(authMiddleware.requireRole('admin'));

  // ==============================================
  // ROLE MANAGEMENT
  // ==============================================

  // Get all roles
  router.get('/roles', async (req, res) => {
    try {
      const roles = await rbacService.getAllRoles();
      res.json({
        success: true,
        roles,
      });
    } catch (error) {
      logger.error('Get roles error:', error);
      res.status(500).json({
        error: 'Failed to get roles',
        code: 'GET_ROLES_ERROR',
      });
    }
  });

  // Get specific role
  router.get('/roles/:roleId', async (req, res) => {
    try {
      const { roleId } = req.params;
      const role = await rbacService.getRole(roleId);

      if (!role) {
        return res.status(404).json({
          error: 'Role not found',
          code: 'ROLE_NOT_FOUND',
        });
      }

      res.json({
        success: true,
        role,
      });
    } catch (error) {
      logger.error('Get role error:', error);
      res.status(500).json({
        error: 'Failed to get role',
        code: 'GET_ROLE_ERROR',
      });
    }
  });

  // Create new role
  router.post('/roles', async (req, res) => {
    try {
      const { name, description, permissions } = req.body;

      if (!name) {
        return res.status(400).json({
          error: 'Role name is required',
          code: 'MISSING_ROLE_NAME',
        });
      }

      const role = await rbacService.createRole({
        name,
        description,
        permissions: permissions || [],
      });

      res.status(201).json({
        success: true,
        role,
      });
    } catch (error) {
      logger.error('Create role error:', error);

      if (error.code === '23505') {
        // Unique constraint violation
        return res.status(409).json({
          error: 'Role name already exists',
          code: 'ROLE_EXISTS',
        });
      }

      res.status(500).json({
        error: 'Failed to create role',
        code: 'CREATE_ROLE_ERROR',
      });
    }
  });

  // Update role
  router.put('/roles/:roleId', async (req, res) => {
    try {
      const { roleId } = req.params;
      const { name, description } = req.body;

      const role = await rbacService.updateRole(roleId, {
        name,
        description,
      });

      res.json({
        success: true,
        role,
      });
    } catch (error) {
      logger.error('Update role error:', error);

      if (error.message === 'Role not found or is a system role') {
        return res.status(404).json({
          error: error.message,
          code: 'ROLE_NOT_FOUND_OR_SYSTEM',
        });
      }

      res.status(500).json({
        error: 'Failed to update role',
        code: 'UPDATE_ROLE_ERROR',
      });
    }
  });

  // Delete role
  router.delete('/roles/:roleId', async (req, res) => {
    try {
      const { roleId } = req.params;
      const role = await rbacService.deleteRole(roleId);

      res.json({
        success: true,
        message: 'Role deleted successfully',
        role,
      });
    } catch (error) {
      logger.error('Delete role error:', error);

      if (error.message === 'Role not found or is a system role') {
        return res.status(404).json({
          error: error.message,
          code: 'ROLE_NOT_FOUND_OR_SYSTEM',
        });
      }

      res.status(500).json({
        error: 'Failed to delete role',
        code: 'DELETE_ROLE_ERROR',
      });
    }
  });

  // ==============================================
  // PERMISSION MANAGEMENT
  // ==============================================

  // Get all permissions
  router.get('/permissions', async (req, res) => {
    try {
      const permissions = await rbacService.getAllPermissions();
      res.json({
        success: true,
        permissions,
      });
    } catch (error) {
      logger.error('Get permissions error:', error);
      res.status(500).json({
        error: 'Failed to get permissions',
        code: 'GET_PERMISSIONS_ERROR',
      });
    }
  });

  // Create new permission
  router.post('/permissions', async (req, res) => {
    try {
      const { name, description, resource } = req.body;

      if (!name) {
        return res.status(400).json({
          error: 'Permission name is required',
          code: 'MISSING_PERMISSION_NAME',
        });
      }

      const permission = await rbacService.createPermission({
        name,
        description,
        resource,
      });

      res.status(201).json({
        success: true,
        permission,
      });
    } catch (error) {
      logger.error('Create permission error:', error);

      if (error.code === '23505') {
        // Unique constraint violation
        return res.status(409).json({
          error: 'Permission name already exists',
          code: 'PERMISSION_EXISTS',
        });
      }

      res.status(500).json({
        error: 'Failed to create permission',
        code: 'CREATE_PERMISSION_ERROR',
      });
    }
  });

  // ==============================================
  // ROLE-PERMISSION ASSIGNMENTS
  // ==============================================

  // Assign permissions to role
  router.post('/roles/:roleId/permissions', async (req, res) => {
    try {
      const { roleId } = req.params;
      const { permissions } = req.body;

      if (!permissions || !Array.isArray(permissions)) {
        return res.status(400).json({
          error: 'Permissions array is required',
          code: 'MISSING_PERMISSIONS',
        });
      }

      await rbacService.assignPermissionsToRole(roleId, permissions);

      res.json({
        success: true,
        message: 'Permissions assigned to role successfully',
      });
    } catch (error) {
      logger.error('Assign permissions error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: error.message,
          code: 'PERMISSIONS_NOT_FOUND',
        });
      }

      res.status(500).json({
        error: 'Failed to assign permissions',
        code: 'ASSIGN_PERMISSIONS_ERROR',
      });
    }
  });

  // Remove permissions from role
  router.delete('/roles/:roleId/permissions', async (req, res) => {
    try {
      const { roleId } = req.params;
      const { permissions } = req.body;

      if (!permissions || !Array.isArray(permissions)) {
        return res.status(400).json({
          error: 'Permissions array is required',
          code: 'MISSING_PERMISSIONS',
        });
      }

      await rbacService.removePermissionsFromRole(roleId, permissions);

      res.json({
        success: true,
        message: 'Permissions removed from role successfully',
      });
    } catch (error) {
      logger.error('Remove permissions error:', error);
      res.status(500).json({
        error: 'Failed to remove permissions',
        code: 'REMOVE_PERMISSIONS_ERROR',
      });
    }
  });

  // ==============================================
  // USER ROLE ASSIGNMENTS
  // ==============================================

  // Assign role to user
  router.post('/users/:userId/roles', async (req, res) => {
    try {
      const { userId } = req.params;
      const { role, scope, expiresAt } = req.body;

      if (!role) {
        return res.status(400).json({
          error: 'Role name is required',
          code: 'MISSING_ROLE',
        });
      }

      const assignment = await rbacService.assignRoleToUser(
        userId,
        role,
        scope,
        expiresAt ? new Date(expiresAt) : null,
        req.user.id, // assigned by current admin
      );

      res.status(201).json({
        success: true,
        message: 'Role assigned to user successfully',
        assignment,
      });
    } catch (error) {
      logger.error('Assign role error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: error.message,
          code: 'ROLE_OR_USER_NOT_FOUND',
        });
      }

      if (error.message.includes('already has this role')) {
        return res.status(409).json({
          error: error.message,
          code: 'ROLE_ALREADY_ASSIGNED',
        });
      }

      res.status(500).json({
        error: 'Failed to assign role',
        code: 'ASSIGN_ROLE_ERROR',
      });
    }
  });

  // Remove role from user
  router.delete('/users/:userId/roles', async (req, res) => {
    try {
      const { userId } = req.params;
      const { role, scope } = req.body;

      if (!role) {
        return res.status(400).json({
          error: 'Role name is required',
          code: 'MISSING_ROLE',
        });
      }

      const assignment = await rbacService.removeRoleFromUser(
        userId,
        role,
        scope,
      );

      if (!assignment) {
        return res.status(404).json({
          error: 'Role assignment not found',
          code: 'ASSIGNMENT_NOT_FOUND',
        });
      }

      res.json({
        success: true,
        message: 'Role removed from user successfully',
        assignment,
      });
    } catch (error) {
      logger.error('Remove role error:', error);
      res.status(500).json({
        error: 'Failed to remove role',
        code: 'REMOVE_ROLE_ERROR',
      });
    }
  });

  // Get user role assignments
  router.get('/users/:userId/roles', async (req, res) => {
    try {
      const { userId } = req.params;
      const assignments = await rbacService.getUserRoleAssignments(userId);

      res.json({
        success: true,
        assignments,
      });
    } catch (error) {
      logger.error('Get user roles error:', error);
      res.status(500).json({
        error: 'Failed to get user roles',
        code: 'GET_USER_ROLES_ERROR',
      });
    }
  });

  // ==============================================
  // ANALYTICS & STATISTICS
  // ==============================================

  // Get role statistics
  router.get('/stats/roles', async (req, res) => {
    try {
      const stats = await rbacService.getRoleStats();
      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      logger.error('Get role stats error:', error);
      res.status(500).json({
        error: 'Failed to get role statistics',
        code: 'GET_ROLE_STATS_ERROR',
      });
    }
  });

  // Get permission usage statistics
  router.get('/stats/permissions', async (req, res) => {
    try {
      const stats = await rbacService.getPermissionUsage();
      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      logger.error('Get permission stats error:', error);
      res.status(500).json({
        error: 'Failed to get permission statistics',
        code: 'GET_PERMISSION_STATS_ERROR',
      });
    }
  });

  // ==============================================
  // ERROR HANDLING
  // ==============================================

  // 404 handler
  router.use('*', (req, res) => {
    res.status(404).json({
      error: 'RBAC endpoint not found',
      code: 'ENDPOINT_NOT_FOUND',
      path: req.originalUrl,
    });
  });

  // Error handler
  router.use((error, req, res, next) => {
    logger.error('RBAC route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  });

  return router;
}

module.exports = createRBACRoutes;
