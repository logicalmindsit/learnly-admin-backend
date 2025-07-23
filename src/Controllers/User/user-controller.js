import User from "../../Models/User/User-Model.js";

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Hide password
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch users", error: error.message });
  }
};

// Update a user by ID
export const updateUserById = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User updated successfully", data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update user", error: error.message });
  }
};

// Delete a user by ID
export const deleteUserById = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User deleted successfully", data: deletedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete user", error: error.message });
  }
};
