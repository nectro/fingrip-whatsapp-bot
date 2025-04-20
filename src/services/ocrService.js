const vision = require('@google-cloud/vision');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { GOOGLE_CLOUD_VISION_CREDENTIALS } = require('../config/config');

// Initialize Google Cloud Vision client with credentials
const client = new vision.ImageAnnotatorClient({
    credentials: GOOGLE_CLOUD_VISION_CREDENTIALS,
    projectId: GOOGLE_CLOUD_VISION_CREDENTIALS.project_id
});

async function processImage(mediaData) {
    let filePath = null;
    let processedPath = null;

    try {
        filePath = path.join(__dirname, '../../temp/temp_image.jpg');
        processedPath = path.join(__dirname, '../../temp/processed_image.jpg');

        // Ensure temp directory exists
        if (!fs.existsSync(path.join(__dirname, '../../temp'))) {
            fs.mkdirSync(path.join(__dirname, '../../temp'), { recursive: true });
        }

        // Save the original image
        fs.writeFileSync(filePath, mediaData, 'base64');

        // Process the image for better OCR
        await sharp(filePath)
            .resize({ width: 1000 })
            .greyscale()
            .normalize()
            .toFile(processedPath);

        // Perform OCR using Google Cloud Vision
        const [result] = await client.textDetection(processedPath);

        if (!result || !result.textAnnotations) {
            throw new Error('Invalid response from Google Cloud Vision API');
        }

        const detections = result.textAnnotations;
        
        if (!detections || detections.length === 0) {
            return {
                success: false,
                error: 'No text detected in image'
            };
        }

        console.log('Detections:', detections);

        const extractedText = detections[0].description;
        console.log('Extracted Text:', extractedText);

        let currencyPatterns = [];

        // Extract amount using regex patterns
        if (extractedText.toLowerCase().includes('cred')) {
            currencyPatterns = [
                /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\n/
            ];
        } else {
            // This pattern matches various Indian currency formats:
            // ₹1,234.56 or Rs. 1,234.56 or INR 1,234.56 or just 1,234.56
            currencyPatterns = [
                /(?:₹|Rs\.?|INR)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,  // Matches ₹1,234.56, Rs. 1,234.56
                /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:₹|Rs\.?|INR)/i,  // Matches 1,234.56 Rs
                /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,                       // Matches plain numbers as fallback
            ];
        }

        let amount = null;
        for (const pattern of currencyPatterns) {
            const match = extractedText.match(pattern);
            if (match) {
                amount = match[1] || match[0];
                break;
            }
        }

        // Clean up the amount
        if (amount) {
            amount = amount.replace(/[^\d.,]/g, ''); // Remove all non-numeric characters except . and ,
        }

        return {
            success: true,
            amount: amount,
            rawText: extractedText,
            confidence: result.textAnnotations[0].confidence || null
        };

    } catch (error) {
        console.error('OCR Processing Error:', error);
        return {
            success: false,
            error: error.message,
            errorDetails: {
                code: error.code,
                details: error.details
            }
        };
    } finally {
        // Clean up temporary files
        try {
            if (filePath && fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            if (processedPath && fs.existsSync(processedPath)) {
                fs.unlinkSync(processedPath);
            }
        } catch (cleanupError) {
            console.error('Error cleaning up temporary files:', cleanupError);
        }
    }
}

module.exports = {
    processImage
}; 