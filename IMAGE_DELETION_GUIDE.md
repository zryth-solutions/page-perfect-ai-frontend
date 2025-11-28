# Image Deletion - Complete Guide

## ✅ Image Deletion Now Properly Removes References from Markdown

### How It Works

When you delete an image, the system performs these steps **in order**:

1. **Removes image reference from markdown** (immediate)
   - Searches for all markdown image syntaxes containing the image
   - Removes: `![alt text](images/filename.jpg)`
   - Handles multiple formats: `images/`, `../images/`, or direct filename
   - Updates the editor content immediately

2. **Deletes from Firebase Storage** (async)
   - Calls Firebase function to delete the actual image file
   - Removes from: `books/{bookId}/extracted/images/{filename}`

3. **Shows confirmation** (success/error)
   - Success: "Image deleted successfully! Remember to save the file."
   - Error: Shows what went wrong but keeps the markdown update

4. **Marks file as unsaved**
   - Yellow "● Unsaved changes" badge appears
   - Save button becomes enabled
   - You must click "Save" to persist the changes

### Step-by-Step Usage

#### 1. View Images in File
```
1. Open a split file in the editor
2. Click "Show Images (N)" button at the top
3. See all images in the file below the editor
```

#### 2. Delete an Image
```
1. Hover over the image you want to delete
2. Click the red "Delete" button that appears
3. Confirm in the modal dialog
4. Wait for deletion to complete
```

#### 3. Save Changes
```
1. Check that "● Unsaved changes" appears in top bar
2. Click the "Save" button
3. Wait for "Saving..." to complete
4. Changes are now persisted to Firebase Storage
```

### What Gets Deleted

#### From Markdown (All Formats)
```markdown
# Before deletion:
![](images/image123.jpg)
![Diagram](../images/image123.jpg)
![Caption](image123.jpg)

# After deletion:
[All three lines are removed]
```

#### From Firebase Storage
```
Path: books/{bookId}/extracted/images/image123.jpg
Status: Permanently deleted
```

### Important Notes

⚠️ **You Must Save the File** - The markdown changes are only in memory until you click Save

✅ **Immediate Feedback** - The image disappears from preview as soon as you confirm deletion

🔍 **Console Logging** - Check browser console for detailed deletion logs:
```javascript
Deleting image from markdown: images/image123.jpg
Extracted filename: image123.jpg
Pattern matched and removed: !\\[[^\\]]*\\]\\(images/image123.jpg\\)
Image references removed from markdown
Starting image deletion process...
Deleting image from Firebase Storage...
Image deleted successfully from storage
```

### Troubleshooting

#### Image Still Shows After Deletion
**Cause**: File not saved
**Solution**: Click the "Save" button in the top right

#### "No image references found to remove" Warning
**Cause**: Image path in markdown doesn't match expected format
**Solution**: Check console logs and manually remove the markdown line

#### Error: "Failed to delete image from storage"
**Cause**: Firebase permissions or network issue
**Solution**: The markdown is still updated - just the storage file wasn't deleted

#### Multiple Image References
**Cause**: Same image used multiple times in file
**Solution**: All references are automatically removed at once

### Testing Checklist

- [ ] Delete an image and verify markdown updates immediately
- [ ] Check "Unsaved changes" badge appears
- [ ] Save the file and verify it persists
- [ ] Reload the page and verify image is gone
- [ ] Check Firebase Storage to confirm deletion
- [ ] Try deleting when file has multiple images
- [ ] Test with images using different path formats

### Technical Details

#### Regex Patterns Used
```javascript
// Matches all these formats:
!\\[[^\\]]*\\]\\(images/filename.jpg\\)
!\\[[^\\]]*\\]\\(\\.\\.\\/images/filename.jpg\\)
!\\[[^\\]]*\\]\\(filename.jpg\\)
!\\[[^\\]]*\\]\\([^)]*filename.jpg[^)]*\\)
```

#### Deletion Sequence
```javascript
1. handleImageDelete() called in MarkdownEditor
   ↓
2. Extract filename from path
   ↓
3. Try multiple regex patterns
   ↓
4. Replace matches with empty string
   ↓
5. Call onChange(updatedContent)
   ↓
6. MarkdownImageRenderer calls Firebase function
   ↓
7. Image deleted from Storage
   ↓
8. User clicks Save to persist
```

### Before vs After Example

#### Before Deletion
```markdown
# Question 1

![](images/diagram1.jpg)

This diagram shows the process.

![Solution](images/diagram1.jpg)

The answer is shown above.
```

#### After Deletion (and Save)
```markdown
# Question 1



This diagram shows the process.



The answer is shown above.
```

Note: Empty lines are left where images were. You can manually clean these up if desired.

---

## Summary

✅ **Deleting an image NOW removes it from the markdown file**
✅ **Multiple formats are handled automatically**
✅ **Console logs show exactly what's happening**
✅ **You must save the file for changes to persist**
✅ **Works for both individual split files and full.md viewer**

The deletion is **immediate in the editor** but requires you to **click Save** to persist the changes to Firebase Storage.

