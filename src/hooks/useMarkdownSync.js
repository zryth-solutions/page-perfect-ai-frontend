import { useEffect, useRef } from 'react';
import { ref, getDownloadURL, listAll } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../firebase';

/**
 * Custom hook to sync markdown files from Firebase Storage to Firestore
 * Checks for .md files in the same folder as the uploaded file
 * and updates the Firestore document with the markdown content
 */
const useMarkdownSync = (book) => {
  const syncedRef = useRef(false);
  const checkIntervalRef = useRef(null);

  useEffect(() => {
    if (!book || !book.filePath || book.status === 'completed' || syncedRef.current) {
      return;
    }

    const checkForMarkdown = async () => {
      try {
        // Extract the folder path from the original file path
        const pathParts = book.filePath.split('/');
        const folderPath = pathParts.slice(0, -1).join('/'); // Get folder without filename
        
        // List all files in the same folder
        const folderRef = ref(storage, `books/${folderPath}`);
        const listResult = await listAll(folderRef);

        // Look for markdown files
        const markdownFiles = listResult.items.filter(item => 
          item.name.endsWith('.md') || item.name.endsWith('.markdown')
        );

        if (markdownFiles.length > 0) {
          // Use the first markdown file found
          const markdownRef = markdownFiles[0];
          
          // Fetch the markdown content
          const downloadURL = await getDownloadURL(markdownRef);
          const response = await fetch(downloadURL);
          const markdownContent = await response.text();

          // Update Firestore with the markdown content
          const bookRef = doc(db, 'books', book.id);
          await updateDoc(bookRef, {
            reportData: markdownContent,
            status: 'completed',
            markdownFileUrl: downloadURL,
            markdownFileName: markdownRef.name,
            processedAt: new Date().toISOString()
          });

          console.log('Markdown synced successfully:', markdownRef.name);
          syncedRef.current = true;
          
          // Clear the interval once synced
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
          }
        }
      } catch (error) {
        // Silently handle errors (file might not exist yet)
        console.log('Checking for markdown...', error.code);
      }
    };

    // Check immediately
    checkForMarkdown();

    // Set up periodic checks every 10 seconds for pending/processing books
    if (book.status === 'pending' || book.status === 'processing') {
      checkIntervalRef.current = setInterval(checkForMarkdown, 10000);
    }

    // Cleanup
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [book]);

  return null;
};

export default useMarkdownSync;

