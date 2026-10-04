const searchService = require('../services/search.service');

class SearchController {
  // GET /api/search?q=...
  async search(req, res, next) {
    try {
      const query = req.query.q || '';
      const facets = req.query.facets ? JSON.parse(req.query.facets) : {};
      const results = await searchService.search(query, facets);
      res.status(200).json(results);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/search/suggestions?q=...
  async getSuggestions(req, res, next) {
    try {
      const query = req.query.q || '';
      const suggestionsData = await searchService.getSuggestions(query);
      res.status(200).json(suggestionsData);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SearchController();
