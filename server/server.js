const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { openai } = require('@ai-sdk/openai');
const { generateText } = require('ai');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI client for Whisper
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/', // temporary directory for uploaded files
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (Whisper's max)
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/webm', 'audio/mp4'];
    const allowedExtensions = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'];
    
    const hasValidMimeType = allowedTypes.includes(file.mimetype);
    const hasValidExtension = allowedExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );
    
    if (hasValidMimeType || hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm'));
    }
  },
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());

// Fitness-specific system prompt for Ninety
const SYSTEM_PROMPT = `You are Ava, an expert AI fitness coach for the Ninety app - a 90-day fitness transformation program based on science-backed muscle building principles.

Your role is to guide users through their fitness journey with:
- Science-based workout recommendations (3-day cycles, progressive overload)
- Nutrition guidance (calorie targets, protein intake, core foods like beans, lentils, oatmeal)  
- Progress tracking and measurement advice
- Motivation and accountability

Key principles you follow:
- Workouts: 3 times per week, 8-10 reps, 3-4 sets, 2.5lbs progressive increases
- Nutrition: Calculate calorie needs, emphasize protein (0.6 x bodyweight in lbs = grams of protein powder needed)
- Measurement: Weekly arm measurements to track muscle growth
- Sleep: 7 hours essential for muscle recovery

Be encouraging, knowledgeable, and always refer back to the proven 90-day transformation principles. Keep responses concise but helpful.`;

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Ninety API is running!', 
    timestamp: new Date().toISOString() 
  });
});

// Voice transcription endpoint
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  console.log('🎙️ Railway API: POST /api/transcribe called');
  
  let tempFilePath = null;
  
  try {
    // Debug: Log the entire req.file object to diagnose issues
    console.log('📦 req.file received:', JSON.stringify(req.file, null, 2));

    if (!req.file) {
      console.error('❌ No file received in request');
      return res.status(400).json({ error: 'No audio file provided' });
    }

    tempFilePath = req.file.path;
    console.log('📁 Uploaded file:', req.file.originalname);
    console.log('📊 File size:', (req.file.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('🔑 OpenAI API Key present:', !!process.env.OPENAI_API_KEY);

    // Create a read stream for the uploaded file
    const audioFile = fs.createReadStream(tempFilePath);

    // Transcribe using OpenAI Whisper
    console.log('🎵 Starting transcription with Whisper...');
    const transcription = await openaiClient.audio.transcriptions.create({
      file: audioFile,
      model: 'gpt-4o-mini-transcribe', // Use the latest model for better quality
      response_format: 'text',
      prompt: 'The following is a conversation about fitness, workouts, nutrition, and health-related topics.',
    });

    console.log('✅ Transcription successful');
    console.log('📝 Transcribed text:', transcription.substring(0, 100) + '...');

    res.json({
      transcription: transcription,
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
    });

  } catch (error) {
    console.error('❌ Transcription error:', error);
    res.status(500).json({
      error: 'Transcription failed',
      details: error.message,
    });
  } finally {
    // Clean up: delete the temporary file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log('🗑️ Cleaned up temporary file:', tempFilePath);
      } catch (cleanupError) {
        console.error('⚠️ Failed to cleanup file:', cleanupError.message);
      }
    }
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  console.log('🚀 Railway API: POST /api/chat called');
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { messages } = req.body;
    console.log('🤖 Setting up AI with', messages?.length || 0, 'messages');
    console.log('🔑 OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
    });

    console.log('✅ AI request successful');
    console.log('🤖 Generated response:', result.text.substring(0, 100) + '...');
    
    res.json({ 
      message: result.text,
      usage: result.usage 
    });
  } catch (error) {
    console.error('❌ Chat API error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Ninety API server running on port ${PORT}`);
  console.log(`🔑 OpenAI API Key configured: ${!!process.env.OPENAI_API_KEY}`);
});