# 🎒 Equipment System Testing Instructions

## 🚀 Quick Test (Main Game)

1. **Open the game**: Navigate to `http://localhost:3007/` 
2. **Wait for loading**: Let the game fully initialize (3-5 seconds)
3. **Open browser console**: Press `F12` > Console tab
4. **Check equipment status**: The debug script runs automatically and shows:
   ```
   🎒 Testing Equipment System...
   ✅ Equipment panel found
   📦 Total equipped items: 3
   📋 Currently equipped items:
     mainHand: 🪨 Throwing Rock (DEFAULT)
     armor: 👔 Ragged Shirt (DEFAULT) 
     legs: 👖 Torn Trousers (DEFAULT)
   ```

5. **Test character sheet**: Press the **"C"** key to open character sheet

## 🔧 Manual Debug Commands

If auto-test doesn't work, run these in browser console:

```javascript
// Check if game engine loaded
debugGameEngine()

// Test equipment system
debugEquipment()

// Check what's available globally
Object.keys(window).filter(k => k.toLowerCase().includes('equipment'))
```

## 🎯 Expected Results

### ✅ Success Indicators:
- **3 default items equipped**: Rock (weapon), Ragged Shirt (chest), Torn Trousers (legs)
- **Character sheet opens** with "C" key
- **Equipment slots visible** with icons and names
- **Console shows** "Equipment panel found" and lists items

### ❌ Failure Signs:
- "Equipment panel not found" error
- No equipped items (empty character sheet)
- "C" key doesn't open character sheet
- Console errors about missing modules

## 🐛 Troubleshooting

1. **If equipment panel not found**:
   - Wait longer for game initialization (up to 10 seconds)
   - Check for console errors in red
   - Refresh the page and try again

2. **If no default equipment**:
   - Run `debugEquipment()` in console
   - Look for "⚠️ No items equipped - attempting to initialize default equipment..."
   - Check if default equipment manager loaded

3. **If character sheet doesn't open**:
   - Make sure you're pressing "C" key (not Ctrl+C)
   - Check if there are any popup blockers
   - Try clicking somewhere on the game first to ensure focus

## 📱 Alternative Testing

If the main game has issues, you can also test by:

1. **Opening built version**: `http://localhost:3007/dist/`
2. **Checking console logs**: Look for equipment-related initialization messages
3. **Testing in production**: Deploy and test on the live site

## 🎮 Game Controls Reminder

- **WASD**: Movement
- **C**: Character Sheet (Equipment)
- **I**: Inventory  
- **M**: Map
- **ESC**: Close dialogs
- **F1**: Help

---

**Status**: Equipment system should auto-initialize with rock, shirt, and pants for all new characters!