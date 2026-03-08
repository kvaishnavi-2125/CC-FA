import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface UploadResponse {
  url: string;
  key: string;
  bucket: string;
}

/**
 * Upload file to S3 bucket
 * @param fileBuffer - Binary file data
 * @param fileName - Original filename
 * @param folder - Folder path in S3 (e.g., 'plants', 'users')
 */
export async function uploadToS3(
  fileBuffer: Buffer,
  fileName: string,
  folder: string = "uploads"
): Promise<UploadResponse> {
  try {
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName.replace(/\s+/g, "-")}`;
    const key = `${folder}/${uniqueFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: fileBuffer,
      ContentType: getContentType(fileName),
      Metadata: {
        "uploaded-at": new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    return {
      url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      key,
      bucket: process.env.AWS_S3_BUCKET!,
    };
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error(`Failed to upload file to S3: ${error}`);
  }
}

/**
 * Get signed URL for secure temporary access
 * @param key - S3 object key
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 */
export async function getSignedS3Url(key: string, expiresIn = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error("Signed URL Error:", error);
    throw new Error(`Failed to generate signed URL: ${error}`);
  }
}

/**
 * Delete file from S3
 * @param key - S3 object key
 */
export async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`Deleted S3 object: ${key}`);
  } catch (error) {
    console.error("S3 Delete Error:", error);
    throw new Error(`Failed to delete file from S3: ${error}`);
  }
}

/**
 * Helper function to determine content type
 */
function getContentType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    pdf: "application/pdf",
    txt: "text/plain",
    json: "application/json",
  };
  return contentTypes[ext!] || "application/octet-stream";
}