const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const leadController = require('../controllers/leadController');

router.get('/', auth, leadController.getLeads);
router.get('/:id', auth, leadController.getLead);
router.post('/', auth, leadController.createLead);
router.put('/:id', auth, leadController.updateLead);
router.delete('/:id', auth, leadController.deleteLead);

module.exports = router; 