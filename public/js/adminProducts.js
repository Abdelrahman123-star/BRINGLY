console.log('Admin Products JS file loaded');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Content Loaded');
  // Modal elements
  const modal = document.getElementById('productModal');
  const deleteModal = document.getElementById('deleteModal');
  const addProductBtn = document.querySelector('.add-product');
  const closeModalBtn = document.querySelector('.close-modal');
  const cancelBtn = document.querySelector('.cancel-btn');
  const productForm = document.getElementById('productForm');
  
  // Delete modal elements
  const deleteProductName = document.getElementById('deleteProductName');
  const cancelDeleteBtn = document.getElementById('cancelDelete');
  const confirmDeleteBtn = document.getElementById('confirmDelete');
  let productToDelete = null;
  
  // Multi-image upload and gallery elements
  const uploadBtn = document.getElementById('uploadBtn');
  const productImages = document.getElementById('productImages');
  const photosGallery = document.getElementById('photosGallery');
  const emptyGalleryState = document.getElementById('emptyGalleryState');
  const imageUrlInput = document.getElementById('imageUrlInput');
  const addUrlBtn = document.getElementById('addUrlBtn');
  const selectedThumbnailInput = document.getElementById('selectedThumbnail');
  const existingImagesJsonInput = document.getElementById('existingImagesJson');

  // In-memory array of photos
  // Each item: { id, type: 'existing' | 'upload' | 'url', src, file, isThumbnail }
  let currentPhotos = [];

  // Sync inputs with current state
  function syncInputs() {
    // 1. Existing images JSON
    const existingList = currentPhotos
      .filter(p => p.type === 'existing' || p.type === 'url')
      .map(p => p.src);
    if (existingImagesJsonInput) {
      existingImagesJsonInput.value = JSON.stringify(existingList);
    }

    // 2. Selected thumbnail value
    const thumbItem = currentPhotos.find(p => p.isThumbnail);
    if (selectedThumbnailInput) {
      if (!thumbItem) {
        selectedThumbnailInput.value = '';
      } else if (thumbItem.type === 'upload') {
        const uploadIndex = currentPhotos.filter(p => p.type === 'upload').indexOf(thumbItem);
        selectedThumbnailInput.value = 'upload:' + uploadIndex;
      } else {
        selectedThumbnailInput.value = thumbItem.src;
      }
    }

    // 3. Sync native input.files with DataTransfer
    if (productImages && window.DataTransfer) {
      const dt = new DataTransfer();
      currentPhotos.filter(p => p.type === 'upload' && p.file).forEach(p => {
        dt.items.add(p.file);
      });
      productImages.files = dt.files;
    }
  }

  // Render photo gallery cards
  function renderGallery() {
    if (!photosGallery) return;

    photosGallery.innerHTML = '';

    if (currentPhotos.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-gallery-state';
      emptyDiv.id = 'emptyGalleryState';
      emptyDiv.innerHTML = `
        <i class="far fa-images" style="font-size: 2rem; color: #cbd5e1; margin-bottom: 8px;"></i>
        <span style="font-size: 0.85rem; color: #64748b;">No photos selected yet.<br>Click "Upload Photos" or add image URLs.</span>
      `;
      photosGallery.appendChild(emptyDiv);
      syncInputs();
      return;
    }

    // Ensure at least one thumbnail is selected
    if (!currentPhotos.some(p => p.isThumbnail)) {
      currentPhotos[0].isThumbnail = true;
    }

    currentPhotos.forEach((photo) => {
      const card = document.createElement('div');
      card.className = 'gallery-item' + (photo.isThumbnail ? ' is-thumb' : '');
      card.title = photo.isThumbnail ? 'Active Thumbnail (Click to change)' : 'Click to set as Homepage Thumbnail';

      card.innerHTML = `
        <img src="${photo.src}" alt="Product Photo">
        ${photo.isThumbnail ? '<span class="thumb-tag"><i class="fas fa-star"></i> Thumbnail</span>' : ''}
        <span class="click-hint">${photo.isThumbnail ? 'Homepage Thumbnail' : 'Set as Thumbnail'}</span>
        <button type="button" class="remove-btn" title="Remove photo">&times;</button>
      `;

      // Click card to set as thumbnail
      card.addEventListener('click', function(e) {
        if (e.target.closest('.remove-btn')) return;
        currentPhotos.forEach(p => { p.isThumbnail = (p.id === photo.id); });
        syncInputs();
        renderGallery();
      });

      // Remove photo
      const removeBtn = card.querySelector('.remove-btn');
      removeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const wasThumb = photo.isThumbnail;
        currentPhotos = currentPhotos.filter(p => p.id !== photo.id);
        if (wasThumb && currentPhotos.length > 0) {
          currentPhotos[0].isThumbnail = true;
        }
        syncInputs();
        renderGallery();
      });

      photosGallery.appendChild(card);
    });

    syncInputs();
  }

  // Handle uploading local photos
  if (uploadBtn && productImages) {
    uploadBtn.addEventListener('click', () => productImages.click());

    productImages.addEventListener('change', function(e) {
      if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files);
        let completed = 0;

        files.forEach(file => {
          const reader = new FileReader();
          reader.onload = function(event) {
            currentPhotos.push({
              id: 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
              type: 'upload',
              src: event.target.result,
              file: file,
              isThumbnail: currentPhotos.length === 0
            });
            completed++;
            if (completed === files.length) {
              renderGallery();
            }
          };
          reader.readAsDataURL(file);
        });
      }
    });
  }

  // Handle adding external image URL
  function handleAddUrl() {
    if (!imageUrlInput) return;
    const rawVal = imageUrlInput.value.trim();
    if (!rawVal) return;

    const urls = rawVal.split(',').map(u => u.trim()).filter(Boolean);
    urls.forEach(u => {
      currentPhotos.push({
        id: 'url_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        type: 'url',
        src: u,
        file: null,
        isThumbnail: currentPhotos.length === 0
      });
    });

    imageUrlInput.value = '';
    renderGallery();
  }

  if (addUrlBtn) addUrlBtn.addEventListener('click', handleAddUrl);
  if (imageUrlInput) {
    imageUrlInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddUrl();
      }
    });
  }

  // Flash message function
  function showFlash(message, type) {
    const flashDiv = document.createElement('div');
    flashDiv.className = `alert alert-${type}`;
    flashDiv.textContent = message;
    
    const mainContent = document.querySelector('.admin-main');
    if (mainContent) {
      mainContent.insertBefore(flashDiv, mainContent.firstChild);
    }

    setTimeout(() => {
      flashDiv.remove();
    }, 5000);
  }
  
  // Using event delegation for delete and edit buttons
  document.addEventListener('click', function(e) {
    if (e.target.closest('.delete')) {
      e.preventDefault();
      const deleteBtn = e.target.closest('.delete');
      productToDelete = deleteBtn.dataset.id;
      deleteProductName.textContent = deleteBtn.dataset.name;
      deleteBtn.productCard = deleteBtn.closest('.product-card');
      deleteModal.style.display = 'block';
    }
    
    if (e.target.closest('.edit')) {
      e.preventDefault();
      const editBtn = e.target.closest('.edit');
      handleEditClick(editBtn);
    }
  });

  // Handle delete confirmation
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async function() {
      try {
        const response = await fetch(`/admin/products/${productToDelete}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        
        deleteModal.style.display = 'none';
        
        if (response.ok) {
          showFlash('Product deleted successfully', 'success');
          const productCard = document.querySelector(`.delete[data-id="${productToDelete}"]`)?.closest('.product-card');
          if (productCard) productCard.remove();
          productToDelete = null;
        } else {
          const data = await response.json();
          showFlash(data.error || 'Failed to delete product', 'danger');
        }
      } catch (error) {
        console.error('Error:', error);
        showFlash('Failed to delete product', 'danger');
        deleteModal.style.display = 'none';
      }
    });
  }

  // Cancel delete
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', function() {
      deleteModal.style.display = 'none';
      productToDelete = null;
    });
  }

  // Edit product functionality
  async function handleEditClick(editBtn) {
    const productId = editBtn.dataset.id;
    try {
      const response = await fetch(`/admin/products/${productId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      const data = await response.json();
      const product = data.product || data;
      
      const nameInput = document.getElementById('productName');
      const priceInput = document.getElementById('productPrice');
      const stockInput = document.getElementById('productStock');
      const descriptionInput = document.getElementById('productDescription');
      const productLinkInput = document.getElementById('productLink');
      
      if (nameInput) nameInput.value = product.name || '';
      if (priceInput) priceInput.value = product.price || 0;
      if (stockInput) stockInput.value = product.stock || 0;
      if (descriptionInput) descriptionInput.value = product.description || '';
      if (productLinkInput) productLinkInput.value = product.productLink || '';
      if (imageUrlInput) imageUrlInput.value = '';
      
      // Handle category selection
      const categorySelect = document.getElementById('productCategory');
      if (categorySelect && product.category && product.category._id) {
        categorySelect.value = product.category._id;
      }
      
      // Populate photo gallery with existing product images
      currentPhotos = [];
      const currentThumb = product.thumbnail || product.imageUrl || product.imagePath || '';

      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        product.images.forEach(img => {
          if (img && typeof img === 'string' && img.trim()) {
            currentPhotos.push({
              id: 'existing_' + Math.random().toString(36).substr(2, 9),
              type: 'existing',
              src: img,
              file: null,
              isThumbnail: (img === currentThumb)
            });
          }
        });
      } else if (currentThumb) {
        currentPhotos.push({
          id: 'existing_' + Math.random().toString(36).substr(2, 9),
          type: 'existing',
          src: currentThumb,
          file: null,
          isThumbnail: true
        });
      }

      if (currentPhotos.length > 0 && !currentPhotos.some(p => p.isThumbnail)) {
        currentPhotos[0].isThumbnail = true;
      }

      renderGallery();
      
      // Update form action and method
      const form = document.getElementById('productForm');
      form.action = `/admin/products/${productId}`;
      form.method = 'POST';
      
      const existingMethodField = form.querySelector('input[name="_method"]');
      if (existingMethodField) existingMethodField.remove();
      
      document.getElementById('modalTitle').textContent = 'Edit Product';
      document.getElementById('submitBtn').textContent = 'Update Product';
      
      openModal();
    } catch (error) {
      console.error('Error:', error);
      showFlash('Failed to load product details', 'danger');
    }
  }
  
  // Modal functions
  function openModal() {
    modal.style.display = 'block';
    disableBodyScroll();
  }
  
  function closeModal() {
    modal.style.display = 'none';
    enableBodyScroll();
    resetForm();
  }
  
  function resetForm() {
    productForm.reset();
    productForm.action = '/admin/products/create';
    productForm.setAttribute('method', 'POST');
    
    const productLinkInput = document.getElementById('productLink');
    if (productLinkInput) productLinkInput.value = '';
    if (imageUrlInput) imageUrlInput.value = '';

    // Reset photos
    currentPhotos = [];
    renderGallery();
    
    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('submitBtn').textContent = 'Add Product';
  }
  
  if (addProductBtn) {
    addProductBtn.addEventListener('click', function() {
      resetForm();
      openModal();
    });
  }
  
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      closeModal();
    }
    if (event.target === deleteModal) {
      deleteModal.style.display = 'none';
      productToDelete = null;
    }
  });

  // Make sure syncInputs runs right before form submission
  if (productForm) {
    productForm.addEventListener('submit', function() {
      syncInputs();
    });
  }
});

// Prevent body scroll when modal is open
function disableBodyScroll() {
  document.body.style.overflow = 'hidden';
}

function enableBodyScroll() {
  document.body.style.overflow = 'auto';
}
