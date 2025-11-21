# Installation & Testing Guide

## Step 1: Verify Prerequisites

### For Docker Method
- [ ] Docker Desktop installed and running
- [ ] Check version: `docker --version` (should be 20.10+)
- [ ] Check compose: `docker-compose --version`

### For Local Development Method
- [ ] Node.js installed (v20+)
- [ ] Check version: `node --version`
- [ ] npm available: `npm --version`

## Step 2: Installation

### Method A: Using Docker (Recommended)

1. Open PowerShell/Terminal in the project folder
2. Start the application:
   ```powershell
   docker-compose up --build
   ```
3. Wait for build to complete (first time takes 5-10 minutes)
4. Look for these messages:
   ```
   backend  | 🚀 Server running on http://localhost:3000
   frontend | nginx started
   ```

### Method B: Local Development

1. Open PowerShell in project folder
2. Install all dependencies:
   ```powershell
   npm run install:all
   ```
3. Open TWO terminal windows:

   **Terminal 1 (Backend):**
   ```powershell
   cd backend
   npm run dev
   ```
   Wait for: `🚀 Server running on http://localhost:3000`

   **Terminal 2 (Frontend):**
   ```powershell
   cd frontend
   npm run dev
   ```
   Wait for: `Local: http://localhost:5173`

## Step 3: Access the Application

### Docker:
- Open browser: http://localhost:8080

### Local Dev:
- Open browser: http://localhost:5173

## Step 4: Testing Checklist

### ✅ Basic Functionality Tests

1. **Page Navigation**
   - [ ] Click on "Library" tab (bottom nav)
   - [ ] Click on "Spin" tab
   - [ ] Click on "History" tab
   - [ ] All pages load without errors

2. **User Switching**
   - [ ] Click user dropdown in header
   - [ ] Switch between "User 1" and "User 2"
   - [ ] Verify selection changes

3. **Category Management**
   - [ ] Click "Categories" button
   - [ ] View 6 default categories
   - [ ] Click "Add New Category"
   - [ ] Create test category: Name: "Test", Type: "Other"
   - [ ] Edit the test category
   - [ ] Delete the test category

4. **Add Date Ideas**
   - [ ] Click "Add Date" button
   - [ ] Fill in:
     - Title: "Coffee Shop Date"
     - Description: "Try the new cafe downtown"
     - Category: Select "Venues"
     - Author: "User 1"
   - [ ] Click "Create"
   - [ ] Verify date appears in library

5. **Add More Dates**
   - [ ] Add at least 3-4 more dates in different categories
   - [ ] Use different authors (User 1 and User 2)
   - [ ] Some with descriptions, some without

6. **Filtering**
   - [ ] Filter by Category (select different categories)
   - [ ] Filter by Author (User 1, User 2, Both)
   - [ ] Filter by Status (Available, Used, All)
   - [ ] Combine multiple filters

7. **Edit & Delete**
   - [ ] Click edit icon on a date
   - [ ] Change the title
   - [ ] Click "Update"
   - [ ] Verify changes saved
   - [ ] Click delete icon on a date
   - [ ] Confirm deletion
   - [ ] Verify date removed

8. **Randomizer**
   - [ ] Go to "Spin" tab
   - [ ] Try clicking spin without selecting categories (should alert)
   - [ ] Select 2-3 categories
   - [ ] Click "Spin the Wheel!"
   - [ ] Wait for animation and result
   - [ ] Verify result shows date from selected categories

9. **Accept Date**
   - [ ] After spinning, click "Accept & Mark as Used"
   - [ ] Go to "History" tab
   - [ ] Verify date appears in history
   - [ ] Go back to "Library"
   - [ ] Filter by "Used" - verify date shows as used

10. **Reroll**
    - [ ] Go to "Spin" tab
    - [ ] Select categories and spin
    - [ ] Click "Reroll"
    - [ ] Verify a different date appears

11. **Reset from History**
    - [ ] Go to "History" tab
    - [ ] Click reset icon on a used date
    - [ ] Confirm reset
    - [ ] Go to "Library"
    - [ ] Filter by "Available" - verify date is back

12. **Data Persistence**
    - [ ] Add several dates
    - [ ] Stop the application (Ctrl+C or `docker-compose down`)
    - [ ] Restart the application
    - [ ] Verify all dates are still there

### ✅ Mobile Responsive Tests

1. **Browser DevTools**
   - [ ] Press F12 to open DevTools
   - [ ] Click "Toggle device toolbar" (Ctrl+Shift+M)
   - [ ] Select "iPhone 12 Pro" or similar
   - [ ] Verify layout looks good
   - [ ] Bottom navigation is visible
   - [ ] Cards stack vertically

2. **Different Screen Sizes**
   - [ ] Test on mobile size (375px)
   - [ ] Test on tablet size (768px)
   - [ ] Test on desktop size (1920px)

### ✅ Error Handling Tests

1. **Empty States**
   - [ ] View library with no dates (shows message)
   - [ ] View history with no used dates (shows message)
   - [ ] Try to spin with all dates used (shows error)

2. **Validation**
   - [ ] Try to create date without title (should prevent)
   - [ ] Try to create date without category (should prevent)
   - [ ] Try to create category without name (should prevent)

## Step 5: Check Database

### Docker:
```powershell
# View database contents
type backend\db.json
```

### Local Dev:
```powershell
# View database contents
type backend\db.json
```

Should see JSON with:
- `categories` array (with 6 default categories)
- `dates` array (with your test dates)

## Step 6: Performance Check

- [ ] Pages load quickly (< 1 second)
- [ ] No console errors (F12 → Console)
- [ ] Smooth animations
- [ ] Responsive interactions

## Common Issues & Solutions

### Issue: Port Already in Use
**Symptoms**: Error starting Docker or local server
**Solution**: 
```powershell
# Check what's using the port
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
# Kill the process or use different port in docker-compose.yml
```

### Issue: Docker Won't Start
**Symptoms**: "Cannot connect to Docker daemon"
**Solution**: 
- Open Docker Desktop
- Wait for it to fully start
- Try again

### Issue: Frontend Shows Blank Page
**Symptoms**: White screen, no content
**Solution**:
- Check browser console (F12)
- Verify backend is running (http://localhost:3000/api/categories should return JSON)
- Check CORS errors

### Issue: Changes Not Saving
**Symptoms**: Data disappears after restart
**Solution**:
- Check `backend/db.json` file exists
- Verify Docker volume mount in `docker-compose.yml`
- Check file permissions

### Issue: CSS Not Loading Properly
**Symptoms**: Unstyled text, no colors
**Solution**:
- Frontend build failed - check terminal for errors
- Try deleting `node_modules` and reinstalling
- Clear browser cache (Ctrl+Shift+R)

## Step 7: Stop the Application

### Docker:
```powershell
# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (deletes database)
docker-compose down -v
```

### Local Dev:
- Press `Ctrl+C` in both terminal windows

## Backup Your Data

Before stopping or testing destructive operations:

```powershell
# Backup database
copy backend\db.json backend\db.backup.json

# Restore from backup
copy backend\db.backup.json backend\db.json
```

## Success Criteria ✅

Your installation is successful if:
- ✅ Application opens in browser
- ✅ All three pages are accessible
- ✅ Can add, edit, delete dates
- ✅ Can manage categories
- ✅ Randomizer works and returns dates
- ✅ Data persists after restart
- ✅ Mobile layout works properly
- ✅ No console errors

## Next Steps

1. Customize user names (replace "User 1" and "User 2")
2. Add your real date ideas
3. Customize colors in `tailwind.config.js`
4. Deploy to a server if desired
5. Enjoy your date nights! 💕

---

**Need Help?** Check:
- README.md for full documentation
- COMMANDS.md for command reference
- PROJECT_SUMMARY.md for technical details
