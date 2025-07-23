import Task from "../../Models/BOS/bos-Task.js";

// Generate Task ID
const generateTaskId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `TASK${timestamp}${random}`;
};

// Create new task
export const createTask = async (req, res) => {
  try {
    const { meeting_id, assigned_to, description, due_date, status } = req.body;

    if (!meeting_id || !assigned_to || !description || !due_date) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const task_id = generateTaskId();

    const newTask = new Task({
      task_id,
      meeting_id,
      assigned_to,
      description,
      due_date,
      status: status || 'pending',
    });

    await newTask.save();

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: newTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating task",
      error: error.message,
    });
  }
};

// Get all tasks
export const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      message: "Tasks retrieved successfully",
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving tasks",
      error: error.message,
    });
  }
};

// Get task by ID
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOne({ task_id: id });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task retrieved successfully",
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving task",
      error: error.message,
    });
  }
};

// Get tasks by meeting ID
export const getTasksByMeetingId = async (req, res) => {
  try {
    const { meeting_id } = req.params;
    const tasks = await Task.find({ meeting_id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Tasks retrieved successfully",
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving tasks",
      error: error.message,
    });
  }
};

// Get tasks by assigned user
export const getTasksByAssignedTo = async (req, res) => {
  try {
    const { assigned_to } = req.params;
    const tasks = await Task.find({ assigned_to }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Tasks retrieved successfully",
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving tasks",
      error: error.message,
    });
  }
};

// Update task
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedTask = await Task.findOneAndUpdate(
      { task_id: id },
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating task",
      error: error.message,
    });
  }
};

// Update task status
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const validStatuses = ['pending', 'in-progress', 'completed', 'overdue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Valid statuses are: " + validStatuses.join(', '),
      });
    }

    const updatedTask = await Task.findOneAndUpdate(
      { task_id: id },
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating task status",
      error: error.message,
    });
  }
};

// Delete task
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTask = await Task.findOneAndDelete({ task_id: id });

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      data: deletedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting task",
      error: error.message,
    });
  }
};

// Get overdue tasks
export const getOverdueTasks = async (req, res) => {
  try {
    const currentDate = new Date();
    const overdueTasks = await Task.find({
      due_date: { $lt: currentDate },
      status: { $ne: 'completed' }
    }).sort({ due_date: 1 });

    res.status(200).json({
      success: true,
      message: "Overdue tasks retrieved successfully",
      data: overdueTasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving overdue tasks",
      error: error.message,
    });
  }
};
