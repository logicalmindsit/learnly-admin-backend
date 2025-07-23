import MonthlyFees from "../../Models/Data-Maintenance/monthly-fees-records-model.js"

export const addMonthlyFee = async (req, res) => {
  try {
    const fee = new MonthlyFees(req.body);
    await fee.save();
    res.status(201).json({ success: true, message: "Monthly fee added", fee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMonthlyFees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 records per page
    const skip = (page - 1) * limit;

    const [fees, total] = await Promise.all([
      MonthlyFees.find()
        .populate("studentId", "name email")
        .sort({ paymentDate: -1 }) 
        .skip(skip)
        .limit(limit),
      MonthlyFees.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      fees
    });
  } catch (error) {
    console.log("error")
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMonthlyFee = async (req, res) => {
  try {
    const fee = await MonthlyFees.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, message: "Monthly fee updated", fee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMonthlyFee = async (req, res) => {
  try {
    await MonthlyFees.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Monthly fee deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};