const Lead = require('../models/Lead');

exports.getLeads = async (req, res) => {
  try {
    const gymId = req.user.gymId;
    
    if (!gymId) {
      return res.status(400).json({ error: 'Gym ID not found' });
    }
    
    const leads = await Lead.find({ gymId }).sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getLead = async (req, res) => {
  try {
    const gymId = req.user.gymId;
    
    if (!gymId) {
      return res.status(400).json({ error: 'Gym ID not found' });
    }
    
    const lead = await Lead.findOne({ _id: req.params.id, gymId });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createLead = async (req, res) => {
  try {
    const { name, phone, source, status, followUpDate, notes } = req.body;
    const gymId = req.user.gymId;
    
    if (!gymId) {
      return res.status(400).json({ error: 'Gym ID not found' });
    }
    
    const lead = new Lead({ 
      name, 
      phone, 
      source, 
      status, 
      followUpDate, 
      notes,
      gymId
    });
    await lead.save();
    res.status(201).json(lead);
  } catch (err) {
    res.status(400).json({ error: 'Invalid data' });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const gymId = req.user.gymId;
    
    if (!gymId) {
      return res.status(400).json({ error: 'Gym ID not found' });
    }
    
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, gymId },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    res.status(400).json({ error: 'Invalid data' });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    const gymId = req.user.gymId;
    
    if (!gymId) {
      return res.status(400).json({ error: 'Gym ID not found' });
    }
    
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, gymId });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}; 