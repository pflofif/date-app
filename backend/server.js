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

// -------------------------
// Translation helpers
// -------------------------
const detectLanguage = (text) => {
  if (!text) return 'en';
  const cyrillicPattern = /[\u0400-\u04FF]/;
  return cyrillicPattern.test(text) ? 'uk' : 'en';
};

const translateText = async (text, targetLang) => {
  if (!text || !text.trim()) return '';
  try {
    const sourceLang = targetLang === 'uk' ? 'en' : 'uk';
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    );
    if (!res.ok) {
      console.error('Translation request failed', res.status);
      return text;
    }
    const data = await res.json();
    const translated = data[0]?.map(item => item[0]).join('') || text;
    return translated;
  } catch (err) {
    console.error('translateText error:', err);
    return text;
  }
};

// Ensure bilingual fields in the DB (runs once at startup)
const ensureTranslationsInDB = async () => {
  await db.read();
  let changed = false;
  const translatedItems = [];

  const isEmpty = (v) => {
    if (v === undefined || v === null) return true;
    if (typeof v === 'string') return v.trim().length === 0;
    if (Array.isArray(v)) return v.length === 0;
    return false;
  };

  console.log('DB translations: starting pass — checking categories and dates');

  // Categories
  if (Array.isArray(db.data.categories)) {
    for (const cat of db.data.categories) {
      // names
      if (isEmpty(cat.name_en) && !isEmpty(cat.name_uk)) {
        console.log(`Translating category.name_uk -> name_en for id=${cat.id}`);
        cat.name_en = await translateText(cat.name_uk, 'en');
        changed = true;
        translatedItems.push(`category:${cat.id}:name_en`);
      }
      if (isEmpty(cat.name_uk) && !isEmpty(cat.name_en)) {
        console.log(`Translating category.name_en -> name_uk for id=${cat.id}`);
        cat.name_uk = await translateText(cat.name_en, 'uk');
        changed = true;
        translatedItems.push(`category:${cat.id}:name_uk`);
      }

      // subcategories: normalize and translate if needed
      const subEn = Array.isArray(cat.subCategories_en) ? cat.subCategories_en : [];
      const subUk = Array.isArray(cat.subCategories_uk) ? cat.subCategories_uk : [];
      const rawSub = Array.isArray(cat.subCategories) ? cat.subCategories : [];

      if (rawSub.length && subEn.length === 0 && subUk.length === 0) {
        const sample = rawSub[0] || '';
        const detected = detectLanguage(sample);
        console.log(`Normalizing raw subCategories for category id=${cat.id}, detected=${detected}`);
        if (detected === 'uk') {
          cat.subCategories_uk = rawSub;
          cat.subCategories_en = await Promise.all(rawSub.map(s => translateText(s, 'en')));
        } else {
          cat.subCategories_en = rawSub;
          cat.subCategories_uk = await Promise.all(rawSub.map(s => translateText(s, 'uk')));
        }
        changed = true;
        translatedItems.push(`category:${cat.id}:subCategories`);
      } else {
        if (subEn.length === 0 && subUk.length > 0) {
          console.log(`Translating subCategories_uk -> subCategories_en for category id=${cat.id}`);
          cat.subCategories_en = await Promise.all(subUk.map(s => translateText(s, 'en')));
          changed = true;
          translatedItems.push(`category:${cat.id}:subCategories_en`);
        }
        if (subUk.length === 0 && subEn.length > 0) {
          console.log(`Translating subCategories_en -> subCategories_uk for category id=${cat.id}`);
          cat.subCategories_uk = await Promise.all(subEn.map(s => translateText(s, 'uk')));
          changed = true;
          translatedItems.push(`category:${cat.id}:subCategories_uk`);
        }
      }
    }
  }

  // Dates
  if (Array.isArray(db.data.dates)) {
    for (const date of db.data.dates) {
      // title
      if (isEmpty(date.title_en) && !isEmpty(date.title_uk)) {
        console.log(`Translating date.title_uk -> title_en for id=${date.id}`);
        date.title_en = await translateText(date.title_uk, 'en');
        changed = true;
        translatedItems.push(`date:${date.id}:title_en`);
      }
      if (isEmpty(date.title_uk) && !isEmpty(date.title_en)) {
        console.log(`Translating date.title_en -> title_uk for id=${date.id}`);
        date.title_uk = await translateText(date.title_en, 'uk');
        changed = true;
        translatedItems.push(`date:${date.id}:title_uk`);
      }

      // description (existing behavior)
      if (isEmpty(date.description_en) && !isEmpty(date.description_uk)) {
        console.log(`Translating date.description_uk -> description_en for id=${date.id}`);
        date.description_en = await translateText(date.description_uk, 'en');
        changed = true;
        translatedItems.push(`date:${date.id}:description_en`);
      }
      if (isEmpty(date.description_uk) && !isEmpty(date.description_en)) {
        console.log(`Translating date.description_en -> description_uk for id=${date.id}`);
        date.description_uk = await translateText(date.description_en, 'uk');
        changed = true;
        translatedItems.push(`date:${date.id}:description_uk`);
      }

      // Fallback: if BOTH descriptions are empty but we have a title, use title as source to populate descriptions
      if (isEmpty(date.description_en) && isEmpty(date.description_uk)) {
        const sourceForDesc = !isEmpty(date.title_en) ? date.title_en : (!isEmpty(date.title_uk) ? date.title_uk : null);
        if (sourceForDesc) {
          console.log(`Filling missing descriptions from title for date id=${date.id}`);
          const srcLang = detectLanguage(sourceForDesc);
          if (isEmpty(date.description_en)) {
            date.description_en = srcLang === 'en' ? sourceForDesc : await translateText(sourceForDesc, 'en');
            translatedItems.push(`date:${date.id}:description_en (from title)`);
            changed = true;
          }
          if (isEmpty(date.description_uk)) {
            date.description_uk = srcLang === 'uk' ? sourceForDesc : await translateText(sourceForDesc, 'uk');
            translatedItems.push(`date:${date.id}:description_uk (from title)`);
            changed = true;
          }
        } else {
          console.log(`No source found to fill descriptions for date id=${date.id}`);
        }
      }

      // subCategory (single string fields)
      if (isEmpty(date.subCategory_en) && !isEmpty(date.subCategory_uk)) {
        console.log(`Translating date.subCategory_uk -> subCategory_en for id=${date.id}`);
        date.subCategory_en = await translateText(date.subCategory_uk, 'en');
        changed = true;
        translatedItems.push(`date:${date.id}:subCategory_en`);
      }
      if (isEmpty(date.subCategory_uk) && !isEmpty(date.subCategory_en)) {
        console.log(`Translating date.subCategory_en -> subCategory_uk for id=${date.id}`);
        date.subCategory_uk = await translateText(date.subCategory_en, 'uk');
        changed = true;
        translatedItems.push(`date:${date.id}:subCategory_uk`);
      }
    }
  }

  if (changed) {
    try {
      await db.write();
      console.log('DB translations: added missing translations to db.json:', translatedItems);
    } catch (err) {
      console.error('Failed to write translations to DB:', err);
    }
  } else {
    console.log('DB translations: nothing to translate');
  }
}

// Initialize DB with default data
async function initDB() {
  await db.read();

  db.data ||= { categories: [], dates: [], settings: { language: 'en' } };

  if (!db.data.categories) {
    db.data.categories = [];
  }
  if (!db.data.dates) {
    db.data.dates = [];
  }
  if (!db.data.settings) {
    db.data.settings = { language: 'en' };
  }

  // Migrate old data: convert isUsed to status AND add bilingual fields
  let needsWrite = false;
  if (db.data.dates && db.data.dates.length > 0) {
    db.data.dates = db.data.dates.map(date => {
      let modified = false;
      let updatedDate = { ...date };

      // Migrate status
      if (date.isUsed !== undefined && date.status === undefined) {
        modified = true;
        const { isUsed, ...rest } = updatedDate;
        updatedDate = {
          ...rest,
          status: isUsed ? 'completed' : 'idle',
          scheduledDate: null
        };
      }

      // Add bilingual fields if missing — do NOT overwrite existing per-language fields.
      // If this record used legacy `title` / `description`, copy it into missing language fields only.
      if (!updatedDate.title_en && date.title) {
        updatedDate.title_en = date.title;
        modified = true;
      }
      if (!updatedDate.title_uk && date.title) {
        updatedDate.title_uk = date.title;
        modified = true;
      }
      if ('title' in updatedDate) {
        delete updatedDate.title;
        modified = true;
      }

      if (!updatedDate.description_en && date.description) {
        updatedDate.description_en = date.description;
        modified = true;
      }
      if (!updatedDate.description_uk && date.description) {
        updatedDate.description_uk = date.description;
        modified = true;
      }
      if ('description' in updatedDate) {
        delete updatedDate.description;
        modified = true;
      }

      if (modified) needsWrite = true;
      return updatedDate;
    });
  }

  // Seed default categories if empty with bilingual names
  if (db.data.categories.length === 0) {
    db.data.categories = [
      {
        id: uuidv4(),
        name_en: 'Venues',
        name_uk: 'Заклади',
        type: 'Indoors'
      },
      {
        id: uuidv4(),
        name_en: 'Active Leisure',
        name_uk: 'Активний відпочинок',
        type: 'Outdoors'
      },
      {
        id: uuidv4(),
        name_en: 'At Home',
        name_uk: 'Вдома',
        type: 'Home',
        subCategories_en: ['Movies', 'Board Games', 'Cooking', 'Crafts', 'Gaming'],
        subCategories_uk: ['Фільми', 'Настільні ігри', 'Кулінарія', 'Творчість', 'Відеоігри']
      },
      {
        id: uuidv4(),
        name_en: 'Long Trip',
        name_uk: 'Довга подорож',
        type: 'Trip'
      },
      {
        id: uuidv4(),
        name_en: 'Short Trip',
        name_uk: 'Коротка подорож',
        type: 'Trip'
      },
      {
        id: uuidv4(),
        name_en: 'Other Outings',
        name_uk: 'Інші прогулянки',
        type: 'Outdoors'
      }
    ];
    needsWrite = true;
  }

  // Migrate existing categories to bilingual
  if (db.data.categories.length > 0) {
    db.data.categories = db.data.categories.map(cat => {
      if (!cat.name_uk) {
        needsWrite = true;
        return {
          ...cat,
          name_en: cat.name,
          name_uk: cat.name,
          ...(cat.subCategories && {
            subCategories_en: cat.subCategories,
            subCategories_uk: cat.subCategories
          })
        };
      }
      return cat;
    });
  }

  if (needsWrite) {
    await db.write();
  }

  // Run translation pass once on startup to fill missing translations
  try {
    await ensureTranslationsInDB();
  } catch (err) {
    console.error('Error during startup translation pass:', err);
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
    const { name_en, name_uk, type, subCategories_en, subCategories_uk } = req.body;

    if (!name_en || !name_uk || !type) {
      return res.status(400).json({ error: 'Name (both languages) and type are required' });
    }

    await db.read();
    const newCategory = {
      id: uuidv4(),
      name_en,
      name_uk,
      type,
      ...(subCategories_en && { subCategories_en }),
      ...(subCategories_uk && { subCategories_uk })
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
    const { name_en, name_uk, type, subCategories_en, subCategories_uk } = req.body;

    await db.read();
    const categoryIndex = db.data.categories.findIndex(c => c.id === id);

    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    db.data.categories[categoryIndex] = {
      ...db.data.categories[categoryIndex],
      name_en: name_en || db.data.categories[categoryIndex].name_en,
      name_uk: name_uk || db.data.categories[categoryIndex].name_uk,
      type: type || db.data.categories[categoryIndex].type,
      ...(subCategories_en && { subCategories_en }),
      ...(subCategories_uk && { subCategories_uk })
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
    const {
      title_en,
      title_uk,
      description_en,
      description_uk,
      category,
      subCategory_en,
      subCategory_uk,
      author
    } = req.body;

    // Require at least one title (either en or uk), plus category and author
    if ((!title_en && !title_uk) || !category || !author) {
      return res.status(400).json({ error: 'Title (at least one language), category, and author are required' });
    }

    await db.read();

    if (!db.data.dates) {
      db.data.dates = [];
    }

    const newDate = {
      id: uuidv4(),
      // store only what's provided; missing language fields remain empty
      title_en: title_en || '',
      title_uk: title_uk || '',
      description_en: description_en || '',
      description_uk: description_uk || '',
      category,
      subCategory_en: subCategory_en || '',
      subCategory_uk: subCategory_uk || '',
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

    const { mood, activityLevel, budget, setting, interests, specialOccasion, categories, language } = req.body;

    if (!mood) {
      return res.status(400).json({ error: 'Mood is required' });
    }

    const lang = language || 'en';
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

    // Enrich dates with category names (use appropriate language)
    const enrichedDates = availableDates.map(date => ({
      id: date.id,
      title: lang === 'uk' ? date.title_uk : date.title_en,
      description: lang === 'uk' ? date.description_uk : date.description_en,
      categoryName: lang === 'uk' ? (categoryMap[date.category]?.name_uk || 'Unknown') : (categoryMap[date.category]?.name_en || 'Unknown'),
      categoryType: categoryMap[date.category]?.type || 'Unknown',
      subCategory: lang === 'uk' ? date.subCategory_uk : date.subCategory_en
    }));

    // Build the prompt in the appropriate language
    const prompts = {
      en: `You are a date planning assistant. Based on the user's preferences, suggest the best date ideas from their existing library.

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

Respond in this exact JSON format in ENGLISH:
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

Respond in this exact JSON format in ENGLISH:
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

Only respond with the JSON, no other text.`,
      uk: `Ви асистент з планування побачень. На основі переваг користувача запропонуйте найкращі ідеї побачень з їхньої бібліотеки.

Переваги користувача:
- Поточний настрій: ${mood}
- Рівень енергії: ${activityLevel}
- Бюджет: ${budget}
${setting ? `- Бажане місце: ${setting}` : ''}
${interests ? `- Інтереси: ${interests}` : ''}
${specialOccasion ? `- Особлива подія: ${specialOccasion}` : ''}

Доступні ідеї побачень у бібліотеці:
${enrichedDates.length > 0 ? enrichedDates.map((d, i) => `${i + 1}. "${d.title}" (Категорія: ${d.categoryName}, Тип: ${d.categoryType})${d.description ? ` - ${d.description}` : ''}`).join('\n') : 'Поки немає ідей у бібліотеці.'}

${enrichedDates.length > 0 ? `
Проаналізуйте доступні побачення та запропонуйте до 3, які найкраще відповідають поточному настрою та перевагам користувача. Для кожної пропозиції:
1. Виберіть з наявної бібліотеки, коли є хороший збіг
2. Коротко поясніть, чому це побачення підходить під їхній настрій
3. Якщо наявні побачення не підходять, можете запропонувати 1-2 нові ідеї

Відповідайте точно у форматі JSON УКРАЇНСЬКОЮ МОВОЮ:
{
  "message": "Коротке персоналізоване вітання/вступ на основі їхнього настрою",
  "suggestions": [
    {
      "title": "Назва побачення",
      "description": "Короткий опис",
      "reason": "Чому це відповідає їхньому настрою/перевагам",
      "isFromLibrary": true/false,
      "existingDateId": "id якщо з бібліотеки, null інакше"
    }
  ]
}` : `
Оскільки їхня бібліотека порожня, запропонуйте 3 креативні ідеї побачень, які відповідають їхнім перевагам.

Відповідайте точно у форматі JSON УКРАЇНСЬКОЮ МОВОЮ:
{
  "message": "Коротке персоналізоване вітання з пропозицією додати їх до бібліотеки",
  "suggestions": [
    {
      "title": "Назва побачення",
      "description": "Короткий опис",
      "reason": "Чому це відповідає їхньому настрою/перевагам",
      "isFromLibrary": false,
      "existingDateId": null
    }
  ]
}`}

Відповідайте лише JSON, без додаткового тексту.`
    };

    const prompt = prompts[lang] || prompts.en;

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
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      const fallbackMessage = lang === 'uk'
        ? "Я знайшов чудові ідеї для вас!"
        : "I found some great date ideas for you!";
      const fallbackReason = lang === 'uk'
        ? "Це може бути чудовим збігом для вашого настрою!"
        : "This could be a great match for your mood!";

      suggestions = {
        message: fallbackMessage,
        suggestions: enrichedDates.slice(0, 3).map(d => ({
          title: d.title,
          description: d.description,
          reason: fallbackReason,
          isFromLibrary: true,
          existingDateId: d.id
        }))
      };
    }

    // Map existingDateId back to actual IDs if needed
    if (suggestions.suggestions) {
      suggestions.suggestions = suggestions.suggestions.map(s => {
        if (s.isFromLibrary && !s.existingDateId) {
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

// Add language setting endpoints
app.get('/api/settings', async (req, res) => {
  try {
    await db.read();
    res.json(db.data.settings || { language: 'en' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const { language } = req.body;

    if (!language || !['en', 'uk'].includes(language)) {
      return res.status(400).json({ error: 'Valid language (en or uk) is required' });
    }

    await db.read();
    db.data.settings = { ...db.data.settings, language };
    await db.write();

    res.json(db.data.settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
