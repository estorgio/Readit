// Modules
const fs = require('fs');
const { shell } = require('electron');

// DOM nodes
const items = document.getElementById('items');

// Get readerJS contents
let readerJS;
fs.readFile(`${__dirname}/reader.js`, (err, data) => {
  readerJS = data.toString();
});

// Track items in storage
exports.storage = JSON.parse(localStorage.getItem('readit-items')) || [];

// Listen for "Done" message from reader window
window.addEventListener('message', e => {
  // Check for correct message
  if (e.data.action === 'delete-reader-item') {
    // Delete item at given index
    this.delete(e.data.itemIndex);

    // Close the reader window
    e.source.close();
  }
});

// Delete item
exports.delete = itemIndex => {
  // Remove item from the DOM
  items.removeChild(items.childNodes[itemIndex]);

  // Remove from storage
  this.storage.splice(itemIndex, 1);

  // Persist
  this.save();

  // Select previous item or first item if first was deleted
  if (this.storage.length) {
    // Get new selected item index
    const newSelectedItemIndex = itemIndex === 0 ? 0 : itemIndex - 1;

    // Set item at new index as selected
    document
      .getElementsByClassName('read-item')
      [newSelectedItemIndex].classList.add('selected');
  }
};

// Get selected item index
exports.getSelectedItem = () => {
  // Get selected node
  const currentItem = document.getElementsByClassName('read-item selected')[0];

  // Get item index
  let itemIndex = 0;
  let child = currentItem;
  while ((child = child.previousSibling) !== null) itemIndex++;

  // Return selected item and index
  return { node: currentItem, index: itemIndex };
};

// Persist storage
exports.save = () => {
  localStorage.setItem('readit-items', JSON.stringify(this.storage));
};

// Set item as selected
exports.select = e => {
  // Remove currently selected item
  this.getSelectedItem().node.classList.remove('selected');

  // Add to clicked item
  e.currentTarget.classList.add('selected');
};

// Move to newly selected item
exports.changeSelection = direction => {
  // Get selected item
  const currentItem = this.getSelectedItem().node;

  // Handle up/down
  if (direction === 'ArrowUp' && currentItem.previousSibling) {
    currentItem.classList.remove('selected');
    currentItem.previousSibling.classList.add('selected');
  } else if (direction === 'ArrowDown' && currentItem.nextSibling) {
    currentItem.classList.remove('selected');
    currentItem.nextSibling.classList.add('selected');
  }
};

exports.openNative = () => {
  // Only if we have items
  if (!this.storage.length) return;

  // Get selected item
  const selectedItem = this.getSelectedItem();

  // Open in system browser
  shell.openExternal(selectedItem.node.dataset.url);
};

// Open selected item
exports.open = () => {
  // Only if we have items (in case of menu open)
  if (!this.storage.length) return;

  // Get selected item
  const selectedItem = this.getSelectedItem();

  // Get item's url
  const contentUrl = selectedItem.node.dataset.url;

  // Open items in proxy BrowserWindow
  const readerWin = window.open(
    contentUrl,
    '',
    `
    maxWidth=2000,
    maxHeight=2000,
    width=1200,
    height=700,
    backgroundColor=#DEDEDE,
    nodeIntegration=0,
    contextIsolation=1
  `,
  );

  // Inject JavaScript with specific item index (selectedItem.index)
  readerWin.eval(readerJS.replace('{{index}}', selectedItem.index));
};

// Add new item
exports.addItem = (item, isNew = false) => {
  // Create a new DOM node
  const itemNode = document.createElement('div');

  // Asign "read-item" class
  itemNode.setAttribute('class', 'read-item');

  // Set item url as data attribute
  itemNode.setAttribute('data-url', item.url);

  // Add inner HTML
  itemNode.innerHTML = `<img src="${item.screenshot}"><h2>${item.title}</h2>`;

  // Append new node to "items" container
  items.appendChild(itemNode);

  // Add click handler to select
  itemNode.addEventListener('click', this.select);

  // Attach open doubleclick handler
  itemNode.addEventListener('dblclick', this.open);

  // If this is the first item, select it
  if (document.getElementsByClassName('read-item').length === 1) {
    itemNode.classList.add('selected');
  }

  // Add item to storage and persist
  if (isNew) {
    this.storage.push(item);
    this.save();
  }
};

// Add items from storage when app loads
exports.storage.forEach(item => {
  this.addItem(item);
});
