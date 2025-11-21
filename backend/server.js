import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

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

// Start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
