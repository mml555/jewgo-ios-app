const EntityControllerNormalized = require('./EntityControllerNormalized');

class StoreController {
  static async getAllStores(req, res) {
    req.query.entityType = 'store';
    return EntityControllerNormalized.getAllEntities(req, res);
  }

  static async getStoreById(req, res) {
    return EntityControllerNormalized.getEntityById(req, res);
  }

  static async searchStores(req, res) {
    req.query.entityType = 'store';
    return EntityControllerNormalized.searchEntities(req, res);
  }

  static async getNearbyStores(req, res) {
    req.query.entityType = 'store';
    return EntityControllerNormalized.getNearbyEntities(req, res);
  }

  static async createStore(req, res) {
    req.body.entityType = 'store';
    return EntityControllerNormalized.createEntity(req, res);
  }

  static async updateStore(req, res) {
    return EntityControllerNormalized.updateEntity(req, res);
  }

  static async deleteStore(req, res) {
    return EntityControllerNormalized.deleteEntity(req, res);
  }
}

module.exports = StoreController;
