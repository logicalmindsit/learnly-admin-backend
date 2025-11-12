import SentMaterial from '../../Models/Notificationbell/SentMaterialModel.js';

export const sendMaterial = async (req, res) => {
  try {
    const { userId, courseName } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded.' });
    }

    const newMaterial = new SentMaterial({
      userId,
      courseName,
      materialName: req.file.originalname,
      filePath: `/uploads/materials/${req.file.filename}`,
    });

    await newMaterial.save();
    res.status(201).json({ message: 'Material sent successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while sending material.' });
  }
};