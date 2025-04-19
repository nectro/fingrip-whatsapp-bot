const { ocrSpace } = require('ocr-space-api-wrapper');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { OCR_API_KEY } = require('../config/config');

async function processImage(mediaData) {
    try {
        const filePath = path.join(__dirname, '../../temp/temp_image.jpg');
        const processedPath = path.join(__dirname, '../../temp/processed_image.jpg');

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

        // Perform OCR
        const result = await ocrSpace(processedPath, {
            apiKey: OCR_API_KEY,
            language: 'eng',
            isOverlayRequired: false,
        });

        // Clean up temporary files
        fs.unlinkSync(filePath);
        fs.unlinkSync(processedPath);

        const extractedText = result.ParsedResults?.[0]?.ParsedText || '';

        console.log(extractedText, "extractedText");

        const amountMatch = extractedText.match(/[₹RsINR*?]{0,3}\s?[\d]{1,3}(?:[,.\d]{0,10})/i);

        return {
            success: true,
            amount: amountMatch ? amountMatch[0].replace("*", "") : null,
            rawText: extractedText
        };

    } catch (error) {
        console.error('OCR Processing Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    processImage
}; 