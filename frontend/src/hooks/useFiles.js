import { useState, useCallback, useEffect } from 'react';

export const useFiles = () => {
  const [stagedFiles, setStagedFiles] = useState([]);

  // (SỬA) handlePaste: Dùng readAsDataURL để đọc base64
  const handlePaste = useCallback((event) => {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    let foundImage = false;
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          foundImage = true;
          
          const reader = new FileReader();
          reader.onload = (e) => {
            setStagedFiles(prevFiles => [...prevFiles, {
              name: file.name || 'pasted-image.png',
              data: e.target.result, 
              type: 'image'
            }]);
          };
          reader.readAsDataURL(file); 
        }
      }
    }
    if (foundImage) {
      event.preventDefault();
    }
  }, []); 

  // (SỬA) handleFileUpload: Dùng readAsDataURL
  const handleFileUpload = (info) => {
    const file = info.file;
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setStagedFiles(prevFiles => [...prevFiles, {
            name: file.name,
            data: e.target.result, 
            type: 'image'
          }]);
        };
        reader.readAsDataURL(file);
      } else {
        setStagedFiles(prevFiles => [...prevFiles, {
          name: file.name,
          data: null, 
          type: 'file'
        }]);
      }
    }
  };

  const handleRemoveStagedFile = (indexToRemove) => {
    setStagedFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  // Đính kèm listener 'paste' vào document
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  return { stagedFiles, setStagedFiles, handleFileUpload, handleRemoveStagedFile };
};