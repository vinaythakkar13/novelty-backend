# File Recovery Guide

## 🔍 Recovery Options for Deleted POC File

### Option 1: Extract from RAR Archive (Most Likely Solution)

You have a backup archive: `/home/vinay/Downloads/backend_training.rar` (13MB, created Nov 21)

**Steps to recover:**

1. **Install RAR extraction tool:**
   ```bash
   sudo apt install unrar
   ```

2. **Extract the archive:**
   ```bash
   cd /home/vinay/Downloads
   unrar x backend_training.rar
   ```

3. **Or extract to a specific location:**
   ```bash
   unrar x backend_training.rar /home/vinay/Downloads/recovered_backend_training/
   ```

4. **List contents first (without extracting):**
   ```bash
   unrar l backend_training.rar
   ```

### Option 2: Check Linux Trash/Recycle Bin

**Location:** `~/.local/share/Trash/files/`

**Commands:**
```bash
# List recently deleted files
ls -lt ~/.local/share/Trash/files/ | head -20

# Search for your file
find ~/.local/share/Trash/files/ -name "*API*" -o -name "*POC*" -o -name "*DOC*"

# Restore a file
cp ~/.local/share/Trash/files/your_file.md /home/vinay/Downloads/backend_training/
```

### Option 3: Use File Recovery Tools

**Install testdisk/photorec:**
```bash
sudo apt install testdisk
```

**Recovery steps:**
```bash
# Run photorec (interactive recovery tool)
sudo photorec

# Or use extundelete (for ext filesystems)
sudo apt install extundelete
sudo extundelete /dev/sdaX --restore-file /path/to/deleted/file
```

### Option 4: Check Editor Auto-Saves/Backups

**VS Code/Cursor backups:**
```bash
# Check VS Code/Cursor backup locations
ls -la ~/.config/Code/User/History/
ls -la ~/.config/Cursor/User/History/
find ~/.config -name "*API*" -o -name "*DOC*" 2>/dev/null
```

**Vim/Nano backups:**
```bash
find ~ -name "*.swp" -o -name "*.swo" -o -name "*~" 2>/dev/null
```

### Option 5: Check Recent File History

```bash
# Check recently modified files
find /home/vinay/Downloads/backend_training -type f -mtime -7 -ls

# Check file access times
find /home/vinay/Downloads/backend_training -type f -atime -7 -ls
```

### Option 6: Check if File is Open in Editor

If you have the file open in Cursor/VS Code:
- Check "Recently Opened" files
- Check "Local History" (if enabled)
- Check "Timeline" view in Explorer

### Option 7: Recreate from Git (if available)

If the project was ever in git:
```bash
cd /home/vinay/Downloads/backend_training
git init  # Initialize if not already
git log --all --full-history -- "*API*" "*DOC*" "*POC*"
git checkout <commit-hash> -- <file-path>
```

## 🚨 Immediate Actions

1. **Stop writing to disk** - Don't create new files to avoid overwriting deleted data
2. **Check trash first** - Easiest recovery method
3. **Extract RAR archive** - Most likely to have your file
4. **Use file recovery tools** - If other methods fail

## 📝 What File Was Deleted?

Based on the context, it appears `API_DOCUMENTATION.md` was deleted. 

**Quick recreation option:**
I can recreate the API documentation file based on the current codebase. Would you like me to regenerate it?

## 🔧 Quick Recovery Commands

Run these commands in order:

```bash
# 1. Check trash
ls -lt ~/.local/share/Trash/files/ | grep -i "api\|doc\|poc" | head -10

# 2. List RAR contents
unrar l /home/vinay/Downloads/backend_training.rar

# 3. Extract RAR (after installing unrar)
unrar x /home/vinay/Downloads/backend_training.rar /tmp/recovered/

# 4. Check editor backups
find ~/.config -type f -name "*API*" 2>/dev/null
```

## 💡 Prevention for Future

1. **Initialize Git:**
   ```bash
   cd /home/vinay/Downloads/backend_training
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Enable auto-save in editor**
3. **Regular backups**
4. **Use version control**

---

**Need help?** Let me know which option you'd like to try, or I can recreate the API documentation file for you!

