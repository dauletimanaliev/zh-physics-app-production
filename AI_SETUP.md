# AI Integration Setup Guide

## 🤖 Real AI-Powered Physics Question Generation

The system now supports **real AI-powered question generation** using OpenAI's Vision API to analyze uploaded physics images and generate contextual questions in Kazakh language.

## Setup Instructions

### 1. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Generate a new API key
4. Copy the key (starts with `sk-...`)

### 2. Configure Environment Variables

#### For Railway Deployment:
1. Go to your Railway project dashboard
2. Navigate to **Variables** tab
3. Add new variable:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** Your OpenAI API key

#### For Local Development:
Add to your `.env` file:
```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3. How It Works

#### With API Key (Real AI):
- ✅ **Real image analysis** using GPT-4 Vision
- ✅ **Contextual questions** based on actual image content
- ✅ **Dynamic generation** - different questions each time
- ✅ **Kazakh language** physics questions
- ✅ **Educational quality** appropriate for high school level

#### Without API Key (Fallback):
- 📝 **Template-based** question selection
- 📝 **Static questions** from predefined pool
- 📝 **Simple image analysis** based on file size
- 📝 **Still functional** but not truly AI-powered

## API Endpoints

### Photo to Question Generation
```bash
POST /api/ai/photo-to-question
Content-Type: multipart/form-data

# Upload physics image file
# Returns generated question with multiple choice answers
```

### Response Format
```json
{
  "success": true,
  "virtual_question": {
    "id": 1234567890,
    "text": "Question text in Kazakh",
    "type": "multiple_choice",
    "options": ["Option A", "Option B", "Option C", "Option D", "Option E"],
    "correct_answer": "Correct option",
    "topic": "Physics topic",
    "difficulty": "easy/medium/hard",
    "explanation": "Detailed explanation in Kazakh",
    "processed_image": "AI processed: filename.jpg (12345 bytes)"
  }
}
```

## Question Categories

The AI generates questions covering:
- **Кинематика** (Kinematics)
- **Динамика** (Dynamics) 
- **Тербелістер** (Oscillations)
- **Электр** (Electricity)
- **Жылу** (Thermodynamics)

## Testing

### Test Real AI Generation:
```bash
# Upload a physics diagram/graph image
curl -X POST https://web-production-2678c.up.railway.app/api/ai/photo-to-question \
  -F "photo=@physics_diagram.jpg"
```

### Check Logs:
- ✅ `Generated X AI questions from image` - Real AI working
- 📝 `Using template-based question generation` - Fallback mode

## Cost Considerations

- **GPT-4 Vision API** costs ~$0.01-0.03 per image analysis
- **Recommended:** Set usage limits in OpenAI dashboard
- **Fallback system** ensures functionality without API costs

## Troubleshooting

### Common Issues:
1. **"Using template-based generation"** - API key not set or invalid
2. **"OpenAI API error"** - Check API key, billing, rate limits
3. **"Failed to parse AI JSON"** - AI response format issue, fallback activated

### Solutions:
- Verify API key is correctly set in environment variables
- Check OpenAI account has sufficient credits
- Monitor Railway deployment logs for errors
