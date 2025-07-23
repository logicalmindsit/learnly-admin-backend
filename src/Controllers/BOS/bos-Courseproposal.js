import CourseProposal from '../../Models/BOS/bos-Courseproposal.js';

// Submit a new course proposal
export async function createProposal(req, res) {
  try {
    // Generate a unique Proposal_id (you might want to adjust this format)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const proposalId = `PROP-${timestamp}-${randomStr}`;

    const proposalData = {
      ...req.body,
      Proposal_id: proposalId,
      submited_on: new Date()
    };

    // Validate PDF file if provided
    if (proposalData.pdf_file) {
      // Check if it's a valid base64 PDF
      if (!proposalData.pdf_file.startsWith('data:application/pdf;base64,')) {
        return res.status(400).json({ error: 'Invalid PDF file format. File must be a PDF.' });
      }
    }

    // Validate required fields
    const requiredFields = ['title', 'description', 'department', 'Proposal_by'];
    const missingFields = requiredFields.filter(field => !proposalData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    const proposal = new CourseProposal(proposalData);
    await proposal.save();
    res.status(201).json(proposal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Get all proposals
export async function getAllProposals(req, res) {
  try {
    const proposals = await CourseProposal.find()
      .sort({ submited_on: -1 }); // Sort by submission date, newest first
    res.json(proposals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get single proposal by ID
export async function getProposalById(req, res) {
  try {
    // First try to find by Proposal_id
    let proposal = await CourseProposal.findOne({ Proposal_id: req.params.id });
    
    // If not found, try to find by MongoDB _id
    if (!proposal) {
      proposal = await CourseProposal.findById(req.params.id);
    }
    
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    res.json(proposal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Update (edit) proposal
export async function updateProposal(req, res) {
  try {
    // Don't allow updating Proposal_id or submited_on
    const { Proposal_id, submited_on, ...updateData } = req.body;

    // Validate PDF file if provided
    if (updateData.pdf_file) {
      // Check if it's a valid base64 PDF
      if (!updateData.pdf_file.startsWith('data:application/pdf;base64,')) {
        return res.status(400).json({ error: 'Invalid PDF file format. File must be a PDF.' });
      }
    }
    
    // First try to find by Proposal_id
    let proposal = await CourseProposal.findOneAndUpdate(
      { Proposal_id: req.params.id },
      updateData,
      { new: true }
    );
    
    // If not found, try to update by MongoDB _id
    if (!proposal) {
      proposal = await CourseProposal.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );
    }
    
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    res.json(proposal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Approve or reject proposal
export async function updateStatus(req, res) {
  try {
    const { status, comments } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // First try to find by Proposal_id
    let proposal = await CourseProposal.findOneAndUpdate(
      { Proposal_id: req.params.id },
      { status, comments },
      { new: true }
    );
    
    // If not found, try to update by MongoDB _id
    if (!proposal) {
      proposal = await CourseProposal.findByIdAndUpdate(
        req.params.id,
        { status, comments },
        { new: true }
      );
    }
    
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    res.json(proposal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
