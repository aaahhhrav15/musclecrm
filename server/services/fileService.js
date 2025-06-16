const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

class FileService {
  constructor() {
    this.uploadDir = path.join(__dirname, '..', 'uploads');
    this.logosDir = path.join(this.uploadDir, 'logos');
    this.ensureDirectories();
  }

  ensureDirectories() {
    try {
      console.log('Ensuring directories exist...');
      console.log('Upload directory:', this.uploadDir);
      console.log('Logos directory:', this.logosDir);

      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(this.uploadDir)) {
        console.log('Creating uploads directory...');
        fs.mkdirSync(this.uploadDir, { recursive: true });
        fs.chmodSync(this.uploadDir, '755');
      }

      // Create logos directory if it doesn't exist
      if (!fs.existsSync(this.logosDir)) {
        console.log('Creating logos directory...');
        fs.mkdirSync(this.logosDir, { recursive: true });
        fs.chmodSync(this.logosDir, '755');
      }

      console.log('Directory permissions set successfully');
    } catch (error) {
      console.error('Error creating directories:', error);
      throw error;
    }
  }

  async saveFile(file, directory = 'logos') {
    try {
      console.log('Saving file...');
      console.log('File details:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });

      const targetDir = path.join(this.uploadDir, directory);
      console.log('Target directory:', targetDir);
      
      // Ensure directory exists
      if (!fs.existsSync(targetDir)) {
        console.log('Creating target directory...');
        fs.mkdirSync(targetDir, { recursive: true });
        fs.chmodSync(targetDir, '755');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000000);
      const ext = path.extname(file.originalname);
      const filename = `${directory}-${timestamp}-${random}${ext}`;
      const filepath = path.join(targetDir, filename);
      
      console.log('Generated filepath:', filepath);

      // Process image with sharp
      console.log('Processing image...');
      const processedBuffer = await sharp(file.buffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();

      // Save the processed file
      console.log('Writing file to disk...');
      await fs.promises.writeFile(filepath, processedBuffer);
      
      // Set file permissions
      console.log('Setting file permissions...');
      await fs.promises.chmod(filepath, '644');

      const relativePath = path.join(directory, filename);
      console.log('File saved successfully:', relativePath);
      
      return relativePath;
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }

  async deleteFile(filepath) {
    try {
      console.log('Deleting file:', filepath);
      const fullPath = path.join(this.uploadDir, filepath);
      console.log('Full path:', fullPath);
      
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        console.log('File deleted successfully');
      } else {
        console.log('File does not exist');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}

module.exports = new FileService(); 