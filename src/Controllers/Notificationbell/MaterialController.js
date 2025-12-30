import SentMaterial from '../../Models/Notificationbell/SentMaterialModel.js';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Configure AWS S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Upload file to S3
const uploadToS3 = async (file) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `materials/${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const command = new PutObjectCommand(params);
  const result = await s3.send(command);
  
  return {
    Location: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`,
    Key: params.Key
  };
};

export const sendMaterial = async (req, res) => {
  try {
    const { userId, courseName } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded.' });
    }

    // Upload to S3
    const result = await uploadToS3(req.file);

    const newMaterial = new SentMaterial({
      userId,
      courseName,
      materialName: req.file.originalname,
      filePath: result.Location,
      s3Key: result.Key,
    });

    await newMaterial.save();
    res.status(201).json({ message: 'Material sent successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while sending material.' });
  }
};