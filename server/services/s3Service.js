const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, PutObjectAclCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const sharp = require('sharp');

class S3Service {
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = process.env.AWS_S3_BUCKET;
  }

  /**
   * Upload an image to S3 with optimization
   * @param {Buffer} imageBuffer - The image buffer
   * @param {string} originalName - Original filename
   * @param {string} folder - Folder path in S3 (e.g., 'logos', 'products')
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - { url, key, filename }
   */
  async uploadImage(imageBuffer, originalName, folder = 'uploads', options = {}) {
    try {
      const {
        maxWidth = 800,
        maxHeight = 800,
        quality = 90,
        format = 'webp'
      } = options;

      // Process image with Sharp
      let processedBuffer = imageBuffer;
      if (format === 'webp') {
        processedBuffer = await sharp(imageBuffer)
          .resize(maxWidth, maxHeight, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .webp({ quality })
          .toBuffer();
      } else if (format === 'png') {
        processedBuffer = await sharp(imageBuffer)
          .resize(maxWidth, maxHeight, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .png({ quality })
          .toBuffer();
      } else if (format === 'jpeg') {
        processedBuffer = await sharp(imageBuffer)
          .resize(maxWidth, maxHeight, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .jpeg({ quality })
          .toBuffer();
      }

      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000);
      const ext = format === 'webp' ? '.webp' : format === 'png' ? '.png' : '.jpg';
      const filename = `${folder}-${timestamp}-${random}${ext}`;
      const key = `${folder}/${filename}`;

      // Upload to S3
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: processedBuffer,
        ContentType: `image/${format}`,
        CacheControl: 'public, max-age=31536000', // 1 year cache
        // ACL: 'public-read', // Make image publicly accessible - removed due to bucket policy
        Metadata: {
          originalName,
          uploadedAt: new Date().toISOString(),
          processed: 'true'
        }
      };

      await this.s3Client.send(new PutObjectCommand(uploadParams));

      // Generate public URL
      const url = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      
      console.log('Image uploaded to S3 successfully:');
      console.log('  - Bucket:', this.bucketName);
      console.log('  - Key:', key);
      console.log('  - URL:', url);
      console.log('  - Size:', processedBuffer.length);

      return {
        url,
        key,
        filename,
        size: processedBuffer.length,
        format
      };
    } catch (error) {
      console.error('Error uploading image to S3:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Upload gym logo with specific optimization
   * @param {Buffer} imageBuffer - The logo buffer
   * @param {string} originalName - Original filename
   * @returns {Promise<Object>} - { url, key, filename }
   */
  async uploadLogo(imageBuffer, originalName) {
    return this.uploadImage(imageBuffer, originalName, 'logos', {
      maxWidth: 512,
      maxHeight: 512,
      quality: 90,
      format: 'webp'
    });
  }

  /**
   * Upload product image with specific optimization
   * @param {Buffer} imageBuffer - The product image buffer
   * @param {string} originalName - Original filename
   * @returns {Promise<Object>} - { url, key, filename }
   */
  async uploadProductImage(imageBuffer, originalName) {
    return this.uploadImage(imageBuffer, originalName, 'products', {
      maxWidth: 800,
      maxHeight: 800,
      quality: 85,
      format: 'webp'
    });
  }

  /**
   * Delete an image from S3
   * @param {string} key - The S3 key to delete
   * @returns {Promise<boolean>} - Success status
   */
  async deleteImage(key) {
    try {
      if (!key) return true; // Nothing to delete

      // Extract key from URL if full URL is passed
      if (key.startsWith('http')) {
        const urlParts = key.split('.com/');
        if (urlParts.length > 1) {
          key = urlParts[1];
        }
      }

      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      }));

      return true;
    } catch (error) {
      console.error('Error deleting image from S3:', error);
      return false;
    }
  }

  /**
   * Generate a presigned URL for private access (if needed)
   * @param {string} key - The S3 key
   * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns {Promise<string>} - Presigned URL
   */
  async generatePresignedUrl(key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  /**
   * Get image metadata from S3
   * @param {string} key - The S3 key
   * @returns {Promise<Object>} - Image metadata
   */
  async getImageMetadata(key) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const response = await this.s3Client.send(command);
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata
      };
    } catch (error) {
      console.error('Error getting image metadata:', error);
      return null;
    }
  }
}

module.exports = new S3Service();
