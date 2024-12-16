// Import Dependencies
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser'); // CSV parsing library

// Custom Modules
const generateUniqueCode = require('./utils/codeGenerator'); // Import code generator
const CodeData = require('./models/formData'); // Mongoose model
require('./db/connect'); // Connects to MongoDB Atlas

// Initialize Express App
const app = express();

// Middleware
app.use(express.json()); // To parse JSON requests
app.use(cors()); // To handle CORS

// Configure Multer for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// =====================
// Routes
// =====================

/**
 * @route   POST /api/upload-csv
 * @desc    Upload CSV file and save records to MongoDB
 * @access  Public
 */
app.post('/api/upload-csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const filePath = path.join(__dirname, req.file.path);
    const records = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Log the parsed data for debugging
        console.log('Parsed CSV row:', data);

        // Adjust these keys as per your CSV structure
        const record = {
          branchName: data.branchName,
          category: data.category,
          subCategory: data.subCategory,
          half: data.half,
          year: data.year,
          itemCode: data.itemCode,
          size: data.size,
          // quantity is optional; if not provided, it will be calculated based on grouping
          quantity: data.quantity ? parseInt(data.quantity, 10) : null,
        };
        records.push(record);
      })
      .on('end', async () => {
        try {
          const { savedRecords, failedRecords } = await saveRecordsCSV(records);
          // Optionally delete the uploaded file after processing
          fs.unlinkSync(filePath);
          res.status(200).json({ 
            message: 'File processed successfully!', 
            totalRecords: records.length,
            savedRecordsCount: savedRecords.length,
            failedRecordsCount: failedRecords.length,
            savedRecords,
            failedRecords
          });
        } catch (err) {
          console.error('Error saving records:', err);
          res.status(500).json({ error: err.message || 'Failed to process CSV data' });
        }
      })
      .on('error', (err) => {
        console.error('Error reading CSV file:', err);
        res.status(500).json({ error: 'Error reading CSV file.' });
      });
  } catch (error) {
    console.error('Error processing file:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * @route   POST /api/upload
 * @desc    Upload JSON data (array of records) and save to MongoDB
 * @access  Public
 */
app.post('/api/upload', async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Invalid payload format. Expected an array of records.' });
    }

    const { savedRecords, failedRecords } = await saveRecordsManual(req.body);
    res.status(200).json({
      message: 'Data processed successfully!',
      totalRecords: req.body.length,
      savedRecordsCount: savedRecords.length,
      failedRecordsCount: failedRecords.length,
      savedRecords,
      failedRecords
    });
  } catch (error) {
    console.error('Error in /api/upload:', error.stack || error.message);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

/**
 * @route   GET /api/fetch-data
 * @desc    Fetch all records from MongoDB and return grouped data
 * @access  Public
 */
app.get('/api/fetch-data', async (req, res) => {
  try {
    // Fetch all documents from the collection
    const data = await CodeData.find();

    // Group data by unique product details
    const groupedData = data.reduce((acc, item) => {
      const key = `${item.branchName}-${item.category}-${item.subCategory}-${item.half}-${item.year}-${item.itemCode}-${item.size}`;
      if (!acc[key]) {
        acc[key] = {
          branchName: item.branchName,
          category: item.category,
          subCategory: item.subCategory,
          half: item.half,
          year: item.year,
          itemCode: item.itemCode,
          size: item.size,
          quantity: item.quantity,
          codes: [...item.codes],
        };
      } else {
        acc[key].codes.push(...item.codes);
      }

      return acc;
    }, {});

    const groupedArray = Object.values(groupedData);

    res.status(200).json({
      total: groupedArray.length,
      data: groupedArray,
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// =====================
// Helper Functions
// =====================

/**
 * Save an array of records to MongoDB for CSV uploads
 * Groups records by prefix and calculates quantity
 * @param {Array} records - Array of record objects
 * @returns {Object} - Object containing arrays of saved and failed records
 */
async function saveRecordsCSV(records) {
  const prefixMap = new Map();

  // Group records by prefix
  records.forEach((record, index) => {
    const { branchName, category, subCategory, half, year, itemCode, size } = record;

    // Construct the prefix based on your specific logic
    const prefix = `${category}${subCategory}${half}${year}${itemCode}${size}`;

    if (prefixMap.has(prefix)) {
      prefixMap.get(prefix).push({ ...record, originalIndex: index + 1 });
    } else {
      prefixMap.set(prefix, [{ ...record, originalIndex: index + 1 }]);
    }
  });

  const groupedRecords = Array.from(prefixMap.entries()).map(([prefix, groupRecords]) => {
    return {
      prefix,
      records: groupRecords,
      quantity: groupRecords.length,
    };
  });

  const savedRecords = [];
  const failedRecords = [];

  // Process each group
  for (const group of groupedRecords) {
    const { records: groupRecords, quantity, prefix } = group;

    try {
      // Generate unique codes based on quantity
      const generatedCodes = await Promise.all(
        Array.from({ length: quantity }).map(() => generateUniqueCode())
      );

      // Construct final codes by appending unique codes
      const finalCodes = generatedCodes.map((uniqueCode) => `${prefix}${uniqueCode}`);

      // Assuming all records in the group have the same fields except 'codes'
      const { branchName, category, subCategory, half, year, itemCode, size } = groupRecords[0];

      const newData = new CodeData({
        branchName,
        category,
        subCategory,
        half,
        year: parseInt(year, 10),
        itemCode,
        size: parseInt(size, 10),
        quantity,
        codes: finalCodes, // Store final calculated codes
      });

      await newData.save();

      // If saved successfully, add to savedRecords with some identifier
      savedRecords.push({
        prefix,
        quantity,
        savedAt: newData.createdAt,
      });
    } catch (saveError) {
      console.error(`Error saving group with prefix ${prefix}:`, saveError);

      // Add to failedRecords with detailed information
      groupRecords.forEach(record => {
        failedRecords.push({
          originalIndex: record.originalIndex,
          recordData: record,
          error: saveError.message || 'Unknown error',
        });
      });
    }
  }

  return { savedRecords, failedRecords };
}

/**
 * Save an array of records to MongoDB for manual uploads
 * Processes each record individually
 * @param {Array} records - Array of record objects
 * @returns {Object} - Object containing arrays of saved and failed records
 */
async function saveRecordsManual(records) {
  const savedRecords = [];
  const failedRecords = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const { branchName, category, subCategory, half, year, itemCode, size, quantity } = record;

    // Validate required fields
    if (!branchName || !category || !subCategory || !half || !year || !itemCode || !size || !quantity) {
      failedRecords.push({
        index: i + 1,
        record,
        error: 'Missing required fields.',
      });
      continue;
    }

    // Ensure year is 2-digit
    if (!/^\d{2}$/.test(String(year))) {
      failedRecords.push({
        index: i + 1,
        record,
        error: 'Invalid year format. Expected a 2-digit number.',
      });
      continue;
    }

    const parsedYear = parseInt(year, 10);
    const parsedSize = parseInt(size, 10);
    const parsedQuantity = parseInt(quantity, 10);

    if (isNaN(parsedYear) || isNaN(parsedSize) || isNaN(parsedQuantity)) {
      failedRecords.push({
        index: i + 1,
        record,
        error: 'Invalid numeric values for year, size, or quantity.',
      });
      continue;
    }

    try {
      // Generate unique codes for the quantity
      const generatedCodes = await Promise.all(
        Array.from({ length: parsedQuantity }).map(() => generateUniqueCode())
      );

      // Generate final calculated codes
      const finalCodes = generatedCodes.map((uniqueCode) =>
        `${subCategory}${category}${half}${year}${itemCode}${size}${uniqueCode}`
      );

      const newData = new CodeData({
        branchName,
        category,
        subCategory,
        half,
        year: parsedYear,
        itemCode,
        size: parsedSize,
        quantity: parsedQuantity,
        codes: finalCodes, // Store final calculated codes
      });

      await newData.save();

      savedRecords.push({
        index: i + 1,
        record: newData,
      });
    } catch (saveError) {
      console.error(`Error saving record ${i + 1}:`, saveError.message);
      failedRecords.push({
        index: i + 1,
        record,
        error: saveError.message || 'Failed to save record.',
      });
    }
  }

  return { savedRecords, failedRecords };
}

// =====================
// Start Server
// =====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
