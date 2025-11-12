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
   * Upload gym banner with enforced 3:1 aspect ratio and optimization
   * @param {Buffer} imageBuffer - The banner buffer
   * @param {string} originalName - Original filename
   * @returns {Promise<Object>} - { url, key, filename }
   */
  async uploadBanner(imageBuffer, originalName) {
    try {
      // Get image metadata to determine optimal dimensions
      const metadata = await sharp(imageBuffer).metadata();
      const originalWidth = metadata.width;
      const originalHeight = metadata.height;
      
      // Calculate target dimensions maintaining 3:1 aspect ratio
      // Use the larger dimension as reference and scale proportionally
      let targetWidth, targetHeight;
      
      if (originalWidth >= originalHeight * 3) {
        // Image is already wide enough, use height as reference
        targetHeight = Math.min(originalHeight, 1200); // Max height of 1200px
        targetWidth = targetHeight * 3;
      } else {
        // Image needs to be cropped, use width as reference
        targetWidth = Math.min(originalWidth, 3600); // Max width of 3600px
        targetHeight = targetWidth / 3;
      }
      
      const processedBuffer = await sharp(imageBuffer)
        .resize({
          width: targetWidth,
          height: targetHeight,
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 90 })
        .toBuffer();

      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000);
      const filename = `banner-${timestamp}-${random}.webp`;
      const key = `banners/${filename}`;

      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: processedBuffer,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000',
        Metadata: {
          originalName,
          uploadedAt: new Date().toISOString(),
          processed: 'true',
          aspect: '3:1',
          originalDimensions: `${originalWidth}x${originalHeight}`,
          processedDimensions: `${targetWidth}x${targetHeight}`
        }
      };

      await this.s3Client.send(new PutObjectCommand(uploadParams));
      const url = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      return { 
        url, 
        key, 
        filename, 
        size: processedBuffer.length, 
        format: 'webp',
        dimensions: `${targetWidth}x${targetHeight}`,
        originalDimensions: `${originalWidth}x${originalHeight}`
      };
    } catch (error) {
      console.error('Error uploading banner to S3:', error);
      throw new Error(`Failed to upload banner: ${error.message}`);
    }
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
   * Upload a video to S3 (no re-encoding here; expects a Buffer)
   * @param {Buffer} videoBuffer
   * @param {string} originalName
   * @param {string} folder
   * @returns {Promise<{ url: string, key: string, filename: string, size: number, format: string }>}
   */
  async uploadVideo(videoBuffer, originalName, folder = 'reels') {
    try {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000);
      const extension = (originalName?.split('.')?.pop() || 'mp4').toLowerCase();
      const safeExt = ['mp4', 'mov', 'webm', 'mkv'].includes(extension) ? extension : 'mp4';
      const filename = `${folder}-${timestamp}-${random}.${safeExt}`;
      const key = `${folder}/${filename}`;

      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: videoBuffer,
        ContentType: `video/${safeExt === 'mp4' ? 'mp4' : safeExt}`,
        CacheControl: 'public, max-age=31536000',
        Metadata: {
          originalName: originalName || filename,
          uploadedAt: new Date().toISOString(),
          processed: 'false'
        }
      };

      await this.s3Client.send(new PutObjectCommand(uploadParams));

      const url = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      return { url, key, filename, size: videoBuffer.length, format: safeExt };
    } catch (error) {
      console.error('Error uploading video to S3:', error);
      throw new Error(`Failed to upload video: ${error.message}`);
    }
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

  /**
   * Upload a document (PDF, DOC, DOCX) to S3
   * @param {Buffer} documentBuffer - The document buffer
   * @param {string} originalName - Original filename
   * @param {string} folder - Folder path in S3 (e.g., 'resumes', 'documents')
   * @returns {Promise<{ url: string, key: string, filename: string, size: number }>}
   */
  async uploadDocument(documentBuffer, originalName, folder = 'documents') {
    try {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000);
      const extension = (originalName?.split('.')?.pop() || 'pdf').toLowerCase();
      const safeExt = ['pdf', 'doc', 'docx'].includes(extension) ? extension : 'pdf';
      const sanitizedFilename = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${folder}-${timestamp}-${random}-${sanitizedFilename}`;
      const key = `${folder}/${filename}`;

      // Determine content type based on extension
      const contentTypeMap = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      const contentType = contentTypeMap[safeExt] || 'application/pdf';

      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: documentBuffer,
        ContentType: contentType,
        CacheControl: 'private, max-age=3600', // Private cache for documents
        Metadata: {
          originalName: originalName || filename,
          uploadedAt: new Date().toISOString(),
          type: 'document'
        }
      };

      await this.s3Client.send(new PutObjectCommand(uploadParams));

      const url = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      
      console.log('Document uploaded to S3 successfully:');
      console.log('  - Bucket:', this.bucketName);
      console.log('  - Key:', key);
      console.log('  - URL:', url);
      console.log('  - Size:', documentBuffer.length);

      return {
        url,
        key,
        filename,
        size: documentBuffer.length,
        contentType
      };
    } catch (error) {
      console.error('Error uploading document to S3:', error);
      throw new Error(`Failed to upload document: ${error.message}`);
    }
  }

  /**
   * Download a document from S3 as a buffer
   * @param {string} key - The S3 key
   * @returns {Promise<Buffer>} - Document buffer
   */
  async downloadDocument(key) {
    try {
      // Extract key from URL if full URL is passed
      if (key.startsWith('http')) {
        const urlParts = key.split('.com/');
        if (urlParts.length > 1) {
          key = urlParts[1];
        }
      }

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const response = await this.s3Client.send(command);
      
      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      return buffer;
    } catch (error) {
      console.error('Error downloading document from S3:', error);
      throw new Error(`Failed to download document: ${error.message}`);
    }
  }

  /**
   * Delete a document from S3
   * @param {string} key - The S3 key to delete
   * @returns {Promise<boolean>} - Success status
   */
  async deleteDocument(key) {
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

      console.log('Document deleted from S3 successfully:', key);
      return true;
    } catch (error) {
      console.error('Error deleting document from S3:', error);
      return false;
    }
  }
}

module.exports = new S3Service();
