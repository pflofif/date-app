import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Groq client
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbFile = join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, {});

// Initialize DB with default data
async function initDB() {
  await db.read();

  db.data ||= { categories: [], dates: [] };

  if (!db.data.categories) {
    db.data.categories = [];
  }
  if (!db.data.dates) {
    db.data.dates = [];
  }

  // Migrate old data: convert isUsed to status
  let needsWrite = false;
  if (db.data.dates && db.data.dates.length > 0) {
    db.data.dates = db.data.dates.map(date => {
      if (date.isUsed !== undefined && date.status === undefined) {
        needsWrite = true;
        const { isUsed, ...rest } = date;
        return {
          ...rest,
          status: isUsed ? 'completed' : 'idle',
          scheduledDate: null
        };
      }
      return date;
    });
  }

  // Seed default categories if empty
  if (db.data.categories.length === 0) {
    db.data.categories = [
      { id: uuidv4(), name: 'Venues', type: 'Indoors' },
      { id: uuidv4(), name: 'Active Leisure', type: 'Outdoors' },
      {
        id: uuidv4(),
        name: 'At Home',
        type: 'Home',
        subCategories: ['Movies', 'Board Games', 'Cooking', 'Crafts', 'Gaming']
      },
      { id: uuidv4(), name: 'Long Trip', type: 'Trip' },
      { id: uuidv4(), name: 'Short Trip', type: 'Trip' },
      { id: uuidv4(), name: 'Other Outings', type: 'Outdoors' }
    ];
    needsWrite = true;
  }

  if (needsWrite) {
    await db.write();
  }
}

// ============ CATEGORY ROUTES ============

// GET all categories
app.get('/api/categories', async (req, res) => {
  try {
    await db.read();
    res.json(db.data.categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST new category
app.post('/api/categories', async (req, res) => {
  try {
    const { name, type, subCategories } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    await db.read();
    const newCategory = {
      id: uuidv4(),
      name,
      type,
      ...(subCategories && { subCategories })
    };

    db.data.categories.push(newCategory);
    await db.write();

    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT update category
app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, subCategories } = req.body;

    await db.read();
    const categoryIndex = db.data.categories.findIndex(c => c.id === id);

    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    db.data.categories[categoryIndex] = {
      ...db.data.categories[categoryIndex],
      name: name || db.data.categories[categoryIndex].name,
      type: type || db.data.categories[categoryIndex].type,
      ...(subCategories && { subCategories })
    };

    await db.write();
    res.json(db.data.categories[categoryIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE category
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.read();
    const initialLength = db.data.categories.length;
    db.data.categories = db.data.categories.filter(c => c.id !== id);

    if (db.data.categories.length === initialLength) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await db.write();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ============ DATE IDEAS ROUTES ============

// GET all dates with optional filters
app.get('/api/dates', async (req, res) => {
  try {
    await db.read();
    let dates = db.data.dates;

    // Filter by category
    if (req.query.category) {
      dates = dates.filter(d => d.category === req.query.category);
    }

    // Filter by author
    if (req.query.author) {
      dates = dates.filter(d => d.author === req.query.author);
    }

    // Filter by status
    if (req.query.status) {
      dates = dates.filter(d => d.status === req.query.status);
    }

    // Legacy: Filter by isUsed (for backward compatibility)
    if (req.query.isUsed !== undefined) {
      const isUsed = req.query.isUsed === 'true';
      dates = dates.filter(d => {
        if (d.status) {
          return isUsed ? (d.status === 'completed') : (d.status === 'idle' || d.status === 'planned');
        }
        return d.isUsed === isUsed;
      });
    }

    res.json(dates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dates' });
  }
});

// GET single date
app.get('/api/dates/:id', async (req, res) => {
  try {
    await db.read();
    const date = db.data.dates.find(d => d.id === req.params.id);

    if (!date) {
      return res.status(404).json({ error: 'Date not found' });
    }

    res.json(date);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch date' });
  }
});

// POST new date
app.post('/api/dates', async (req, res) => {
  try {
    const { title, description, category, subCategory, author } = req.body;

    if (!title || !category || !author) {
      return res.status(400).json({ error: 'Title, category, and author are required' });
    }

    await db.read();

    if (!db.data.dates) {
      db.data.dates = [];
    }

    const newDate = {
      id: uuidv4(),
      title,
      description: description || '',
      category,
      subCategory: subCategory || null,
      status: 'idle',
      scheduledDate: null,
      author,
      createdAt: new Date().toISOString()
    };

    db.data.dates.push(newDate);
    await db.write();

    res.status(201).json(newDate);
  } catch (error) {
    console.error('Error creating date:', error);
    res.status(500).json({ error: 'Failed to create date' });
  }
});

// PUT update date
app.put('/api/dates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    await db.read();
    const dateIndex = db.data.dates.findIndex(d => d.id === id);

    if (dateIndex === -1) {
      return res.status(404).json({ error: 'Date not found' });
    }

    db.data.dates[dateIndex] = {
      ...db.data.dates[dateIndex],
      ...updates,
      id, // Ensure ID doesn't change
      createdAt: db.data.dates[dateIndex].createdAt // Preserve creation date
    };

    await db.write();
    res.json(db.data.dates[dateIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update date' });
  }
});

// DELETE date
app.delete('/api/dates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.read();
    const initialLength = db.data.dates.length;
    db.data.dates = db.data.dates.filter(d => d.id !== id);

    if (db.data.dates.length === initialLength) {
      return res.status(404).json({ error: 'Date not found' });
    }

    await db.write();
    res.json({ message: 'Date deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete date' });
  }
});

// POST get random date
app.post('/api/dates/random', async (req, res) => {
  try {
    const { categories } = req.body;

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ error: 'Categories array is required' });
    }

    await db.read();
    const availableDates = db.data.dates.filter(
      d => {
        const isIdle = d.status ? d.status === 'idle' : !d.isUsed;
        return isIdle && categories.includes(d.category);
      }
    );

    if (availableDates.length === 0) {
      return res.status(404).json({ error: 'No available dates found with selected categories' });
    }

    const randomDate = availableDates[Math.floor(Math.random() * availableDates.length)];
    res.json(randomDate);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get random date' });
  }
});

// POST AI date suggestion
app.post('/api/dates/ai-suggest', async (req, res) => {
  try {
    if (!groq) {
      return res.status(500).json({ error: 'AI service not configured. Please set GROQ_API_KEY environment variable.' });
    }

    const { mood, activityLevel, budget, setting, interests, specialOccasion, categories } = req.body;

    if (!mood) {
      return res.status(400).json({ error: 'Mood is required' });
    }

    await db.read();

    // Get all available dates with their category info
    const availableDates = db.data.dates.filter(d => {
      const isIdle = d.status ? d.status === 'idle' : !d.isUsed;
      return isIdle;
    });

    // Build category lookup
    const categoryMap = {};
    db.data.categories.forEach(cat => {
      categoryMap[cat.id] = cat;
    });

    // Enrich dates with category names
    const enrichedDates = availableDates.map(date => ({
      id: date.id,
      title: date.title,
      description: date.description,
      categoryName: categoryMap[date.category]?.name || 'Unknown',
      categoryType: categoryMap[date.category]?.type || 'Unknown',
      subCategory: date.subCategory
    }));

    // Build the prompt for Groq
    const prompt = `You are a date planning assistant. Based on the user's preferences, suggest the best date ideas from their existing library.

User Preferences:
- Current Mood: ${mood}
- Energy Level: ${activityLevel}
- Budget: ${budget}
${setting ? `- Preferred Setting: ${setting}` : ''}
${interests ? `- Interests: ${interests}` : ''}
${specialOccasion ? `- Special Occasion: ${specialOccasion}` : ''}

Available Date Ideas in their Library:
${enrichedDates.length > 0 ? enrichedDates.map((d, i) => `${i + 1}. "${d.title}" (Category: ${d.categoryName}, Type: ${d.categoryType})${d.description ? ` - ${d.description}` : ''}`).join('\n') : 'No dates in library yet.'}

${enrichedDates.length > 0 ? `
Please analyze the available dates and suggest up to 3 that best match the user's current mood and preferences. For each suggestion:
1. Pick from the existing library when there's a good match
2. Explain briefly why this date fits their current mood
3. If no existing dates match well, you can suggest 1-2 new ideas that would fit

Respond in this exact JSON format:
{
  "message": "A brief personalized greeting/intro based on their mood",
  "suggestions": [
    {
      "title": "Date title",
      "description": "Brief description",
      "reason": "Why this matches their mood/preferences",
      "isFromLibrary": true/false,
      "existingDateId": "id if from library, null otherwise"
    }
  ]
}` : `
Since their library is empty, suggest 3 creative date ideas that match their preferences.

Respond in this exact JSON format:
{
  "message": "A brief personalized greeting suggesting they add these to their library",
  "suggestions": [
    {
      "title": "Date title",
      "description": "Brief description",
      "reason": "Why this matches their mood/preferences",
      "isFromLibrary": false,
      "existingDateId": null
    }
  ]
}`}

Only respond with the JSON, no other text.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // Parse the JSON response
    let suggestions;
    try {
      // Extract JSON from response (handle potential markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      suggestions = {
        message: "I found some great date ideas for you!",
        suggestions: enrichedDates.slice(0, 3).map(d => ({
          title: d.title,
          description: d.description,
          reason: "This could be a great match for your mood!",
          isFromLibrary: true,
          existingDateId: d.id
        }))
      };
    }

    // Map existingDateId back to actual IDs if needed
    if (suggestions.suggestions) {
      suggestions.suggestions = suggestions.suggestions.map(s => {
        if (s.isFromLibrary && !s.existingDateId) {
          // Try to find the matching date by title
          const matchingDate = enrichedDates.find(d =>
            d.title.toLowerCase() === s.title.toLowerCase()
          );
          if (matchingDate) {
            s.existingDateId = matchingDate.id;
          }
        }
        return s;
      });
    }

    res.json(suggestions);
  } catch (error) {
    console.error('AI suggestion error:', error);
    res.status(500).json({ error: 'Failed to get AI suggestions. Please try again.' });
  }
});

// Start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
