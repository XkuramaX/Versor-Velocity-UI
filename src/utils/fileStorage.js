// Shared file storage for upload nodes - stores file references, not file data
export const fileStorage = new Map();

// Store file with URL for memory efficiency
export const storeFile = (fileRef, file) => {
  const fileUrl = URL.createObjectURL(file);
  fileStorage.set(fileRef, { file, fileUrl, name: file.name, size: file.size });
  return fileRef;
};

// Get file from storage
export const getFile = (fileRef) => {
  const stored = fileStorage.get(fileRef);
  return stored?.file;
};

// Clean up file storage
export const cleanupFile = (fileRef) => {
  const stored = fileStorage.get(fileRef);
  if (stored?.fileUrl) {
    URL.revokeObjectURL(stored.fileUrl);
  }
  fileStorage.delete(fileRef);
};