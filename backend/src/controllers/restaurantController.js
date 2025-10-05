const EntityControllerNormalized = require('./EntityControllerNormalized');

class RestaurantController {
  static async getAllRestaurants(req, res) {
    req.query.entityType = 'restaurant';
    return EntityControllerNormalized.getAllEntities(req, res);
  }

  static async getRestaurantById(req, res) {
    return EntityControllerNormalized.getEntityById(req, res);
  }

  static async searchRestaurants(req, res) {
    req.query.entityType = 'restaurant';
    return EntityControllerNormalized.searchEntities(req, res);
  }

  static async getNearbyRestaurants(req, res) {
    req.query.entityType = 'restaurant';
    return EntityControllerNormalized.getNearbyEntities(req, res);
  }

  static async createRestaurant(req, res) {
    req.body.entityType = 'restaurant';
    return EntityControllerNormalized.createEntity(req, res);
  }

  static async updateRestaurant(req, res) {
    return EntityControllerNormalized.updateEntity(req, res);
  }

  static async deleteRestaurant(req, res) {
    return EntityControllerNormalized.deleteEntity(req, res);
  }
}

module.exports = RestaurantController;
