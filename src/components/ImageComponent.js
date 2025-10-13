import React, { useState, useRef } from 'react';
import './ImageComponent.css';

const ImageComponent = ({ 
  element, 
  onUpdate, 
  onClose, 
  isEditing = false 
}) => {
  const [imageData, setImageData] = useState(element.imageData || null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setIsLoading(true);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = {
          src: e.target.result,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString()
        };
        
        setImageData(imageData);
        onUpdate({
          ...element,
          imageData: imageData
        });
        setIsLoading(false);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageData(null);
    onUpdate({
      ...element,
      imageData: null
    });
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  if (isEditing) {
    return (
      <div className="image-editing-container">
        <div className="image-editing-content">
          <div className="image-editing-header">
            <h3>Edit Image</h3>
            <button className="close-btn" onClick={handleClose}>×</button>
          </div>
          <div className="image-editing-body">
            <div className="image-upload-section">
              <label className="upload-label">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <div className="upload-button">
                  <span className="upload-icon">📁</span>
                  <span className="upload-text">Choose Image from Local Storage</span>
                </div>
              </label>
              
              {isLoading && (
                <div className="loading-indicator">
                  <span>Loading image...</span>
                </div>
              )}
            </div>

            {imageData && (
              <div className="image-preview-section">
                <h4>Current Image:</h4>
                <div className="image-preview">
                  <img 
                    src={imageData.src} 
                    alt={imageData.name}
                    className="preview-image"
                  />
                  <div className="image-info">
                    <p><strong>Name:</strong> {imageData.name}</p>
                    <p><strong>Size:</strong> {(imageData.size / 1024).toFixed(1)} KB</p>
                    <p><strong>Type:</strong> {imageData.type}</p>
                  </div>
                  <button 
                    className="remove-image-btn"
                    onClick={handleRemoveImage}
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            )}

            <div className="image-instructions">
              <h4>Instructions:</h4>
              <ul>
                <li>Click "Choose Image from Local Storage" to select an image file</li>
                <li>Supported formats: JPG, PNG, GIF, WebP</li>
                <li>Images are stored locally in your browser</li>
                <li>Click "Remove Image" to delete the current image</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="image-element" onClick={() => onClose && onClose(true)}>
      {imageData ? (
        <div className="image-container">
          <img 
            src={imageData.src} 
            alt={imageData.name}
            className="slide-image"
          />
          <div className="image-overlay">
            <span className="edit-text">Click to edit image</span>
          </div>
        </div>
      ) : (
        <div className="image-placeholder">
          <div className="placeholder-content">
            <span className="placeholder-icon">🖼️</span>
            <span className="placeholder-text">No Image</span>
            <span className="placeholder-subtext">Click to add image</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageComponent;
