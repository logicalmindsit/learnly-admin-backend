import Payment from "../../Models/Payment/Payment-Model.js";

export const getAllPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      order = "desc",
      search = "",
    } = req.query;

    const query = {};

    // Optional search filter by email, mobile, studentRegisterNumber, or username
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { email: searchRegex },
        { mobile: searchRegex },
        { studentRegisterNumber: searchRegex },
        { username: searchRegex },
        { transactionId: searchRegex },
      ];
    }

    const payments = await Payment.find(query)
      .populate("userId", "username email studentRegisterNumber")
      .populate("courseId", "courseName")
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalCount = await Payment.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total: totalCount,
        page: Number(page),
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve payments",
      error: error.message,
    });
  }
};
