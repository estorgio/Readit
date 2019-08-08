const { ipcRenderer } = require('electron');
const items = require('./items');

// DOM nodes
const showModal = document.getElementById('show-modal');
const closeModal = document.getElementById('close-modal');
const modal = document.getElementById('modal');
const addItem = document.getElementById('add-item');
const itemUrl = document.getElementById('url');
const search = document.getElementById('search');

// Open new item modal
window.newItem = () => {
  showModal.click();
};

// Ref items.open globally
window.openItem = items.open;

// Ref items.delete globally
window.deleteItem = () => {
  const selectedItem = items.getSelectedItem();
  items.delete(selectedItem.index);
};

// Open item in native browser
window.openItemNative = items.openNative;

// Focus to search items
window.searchItems = () => {
  search.focus();
};

// Filter items with search
search.addEventListener('keyup', e => {
  // Loop items
  Array.from(document.getElementsByClassName('read-item')).forEach(item => {
    // Hide any items that don't match the search value
    const hasMatch = item.innerText.toLowerCase().includes(search.value);
    item.style.display = hasMatch ? 'flex' : 'none';
  });
});

// Navigate item selection with up/down arrows
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    items.changeSelection(e.key);
  }
});

// Disable and Enable modal buttons
const toggleModalButtons = () => {
  // Check state of buttons
  if (addItem.disabled) {
    addItem.disabled = false;
    addItem.style.opacity = 1;
    addItem.innerText = 'Add Item';
    closeModal.style.display = 'inline';
  } else {
    addItem.disabled = true;
    addItem.style.opacity = 0.5;
    addItem.innerText = 'Adding...';
    closeModal.style.display = 'none';
  }
};

// Show modal
showModal.addEventListener('click', e => {
  modal.style.display = 'flex';
  itemUrl.focus();
});

// Hide modal
closeModal.addEventListener('click', e => {
  modal.style.display = 'none';
});

// Handle new items
addItem.addEventListener('click', e => {
  // Check a url exists
  if (itemUrl.value) {
    // Send new item url to main process
    ipcRenderer.send('new-item', itemUrl.value);

    // Disable buttons
    toggleModalButtons();
  }
});

// Listen for new item from main process
ipcRenderer.on('new-item-success', (e, newItem) => {
  // Add items to "items" element
  items.addItem(newItem, true);

  // Enable buttons
  toggleModalButtons();

  // Hide modal and clear value
  modal.style.display = 'none';
  itemUrl.value = '';
});

// Listen for keyboard submit
itemUrl.addEventListener('keyup', e => {
  if (e.key === 'Enter') addItem.click();
});
