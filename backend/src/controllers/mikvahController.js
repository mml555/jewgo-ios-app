const EntityControllerNormalized = require('./EntityControllerNormalized');

class MikvahController {
  static async getAllMikvahs(req, res) {
    req.query.entityType = 'mikvah';
    return EntityControllerNormalized.getAllEntities(req, res);
  }

  static async getMikvahById(req, res) {
    return EntityControllerNormalized.getEntityById(req, res);
  }

  static async searchMikvahs(req, res) {
    req.query.entityType = 'mikvah';
    return EntityControllerNormalized.searchEntities(req, res);
  }

  static async getNearbyMikvahs(req, res) {
    req.query.entityType = 'mikvah';
    return EntityControllerNormalized.getNearbyEntities(req, res);
  }

  static async createMikvah(req, res) {
    req.body.entityType = 'mikvah';
    return EntityControllerNormalized.createEntity(req, res);
  }

  static async updateMikvah(req, res) {
    return EntityControllerNormalized.updateEntity(req, res);
  }

  static async deleteMikvah(req, res) {
    return EntityControllerNormalized.deleteEntity(req, res);
  }
}

module.exports = MikvahController;
