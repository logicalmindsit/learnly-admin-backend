import EMIPlan from '../../Models/Payment/Emi-Plan-Model.js';

export const getAllEMIPlans = async (req, res) => {
  try {
    const emiPlans = await EMIPlan.find()
      .populate('userId', 'username email studentRegisterNumber') // select only needed fields
      .populate('courseId', 'coursename coursePrice courseduration') // select only needed fields
      .sort({ createdAt: -1 }); // newest first

    return res.status(200).json({
      success: true,
      message: "Fetched all EMI plans successfully",
      data: emiPlans,
    });
  } catch (error) {
    console.error("Error fetching EMI plans:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error while fetching EMI plans",
      error: error.message,
    });
  }
};
