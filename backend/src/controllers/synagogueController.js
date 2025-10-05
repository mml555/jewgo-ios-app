const EntityControllerNormalized = require('./EntityControllerNormalized');

class SynagogueController {
  static async getAllSynagogues(req, res) {
    req.query.entityType = 'synagogue';
    return EntityControllerNormalized.getAllEntities(req, res);
  }

  static async getSynagogueById(req, res) {
    return EntityControllerNormalized.getEntityById(req, res);
  }

  static async searchSynagogues(req, res) {
    req.query.entityType = 'synagogue';
    return EntityControllerNormalized.searchEntities(req, res);
  }

  static async getNearbySynagogues(req, res) {
    req.query.entityType = 'synagogue';
    return EntityControllerNormalized.getNearbyEntities(req, res);
  }

  static async createSynagogue(req, res) {
    req.body.entityType = 'synagogue';
    return EntityControllerNormalized.createEntity(req, res);
  }

  static async updateSynagogue(req, res) {
    return EntityControllerNormalized.updateEntity(req, res);
  }

  static async deleteSynagogue(req, res) {
    return EntityControllerNormalized.deleteEntity(req, res);
  }
}

module.exports = SynagogueController;
