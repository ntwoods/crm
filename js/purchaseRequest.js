// GLOBAL variable defined (ensure this is accessible)
document.addEventListener('DOMContentLoaded', () => {
    const raisePurchaseRequestBtn = document.getElementById('raise-purchase-request-btn');
    const purchaseRequestModal = document.getElementById('purchase-request-modal');
    const closeButton = purchaseRequestModal.querySelector('.close-button');
    const purchaseRequestForm = document.getElementById('purchase-request-form');
    const submitPrButton = document.getElementById('submit-pr-button'); // Get the submit button
    const prLoadingSpinner = document.getElementById('pr-loading-spinner'); // Get the spinner

    // New elements for item selection
    const itemSearchInput = document.getElementById('item-search-input');
    const itemSearchResults = document.getElementById('item-search-results');
    const addSelectedItemsBtn = document.getElementById('add-selected-items-btn');
    const selectedItemsDisplay = document.getElementById('selected-items-display');

    // Data storage for products and selected items
    let allProducts = []; // Stores all products fetched from the sheet
    let searchSelectedProducts = new Set(); // Stores products selected from search results (temporary selection)
    let finalSelectedItems = []; // Stores products added to the form with quantities

    // Function to show a toast notification
    function showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) { // Safety check
            console.error('Toast container not found!');
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // Show the toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Hide and remove the toast after a duration
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    }

    // Function to close the modal and reset the flag
    const closeModal = () => {
        purchaseRequestModal.style.display = 'none';
        purchaseRequestForm.reset(); // Clear the form when closed
        if (typeof isModalOpen !== 'undefined') { // Ensure the global flag exists
            isModalOpen = false; // Set flag to false when modal is closed
        }
        // Ensure spinner is hidden when modal closes
        prLoadingSpinner.style.display = 'none';
        submitPrButton.disabled = false; // Re-enable button
        submitPrButton.textContent = 'Submit Request'; // Reset button text

        // Reset item selection specific states
        itemSearchInput.value = '';
        itemSearchResults.innerHTML = '';
        itemSearchResults.classList.remove('show');
        searchSelectedProducts.clear(); // Clear temporary selections
        finalSelectedItems = []; // Clear final selected items
        renderFinalSelectedItems(); // Clear the display
        selectedItemsDisplay.style.display = 'none'; // Hide the display
    };

    // Hide the modal when the close button is clicked
    closeButton.addEventListener('click', closeModal);

    // Hide the modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === purchaseRequestModal) {
            closeModal();
        }
    });

    // --- Item Selection Logic ---

    // Function to fetch products from Google Sheet
    async function fetchProducts() {
        // IMPORTANT: Replace this with your actual Google Apps Script URL for FETCHING data.
        // This Apps Script should read Column C from the 'IMS' sheet and return a JSON array of product names.
        // Example Apps Script doGet function:
        /*
        function doGet(e) {
          const sheetId = '1UeohB4IPgEzGwybOJaIKpCIa38A4UvBstM8waqYv9V0';
          const sheetName = 'IMS';
          const spreadsheet = SpreadsheetApp.openById(sheetId);
          const sheet = spreadsheet.getSheetByName(sheetName);
          const range = sheet.getRange('C3:C' + sheet.getLastRow()); // Column C, starting from row 3
          const values = range.getValues();
          const products = values.flat().filter(String); // Flatten and remove empty strings
          return ContentService.createTextOutput(JSON.stringify(products)).setMimeType(ContentService.MimeType.JSON);
        }
        */
        const fetchProductsUrl = 'https://script.google.com/macros/s/AKfycbx_YOUR_FETCH_SCRIPT_ID_HERE/exec'; // Placeholder URL

        try {
            const response = await fetch(fetchProductsUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allProducts = await response.json();
            console.log('Products fetched:', allProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
            showToast('Failed to load product list. Please try again later.', 'error');
            // Mock data for development if fetch fails
            allProducts = [
                "Product A (Wood)", "Product B (Metal)", "Product C (Plastic)",
                "Product D (Glass)", "Product E (Fabric)", "Product F (Ceramic)",
                "Product G (Rubber)", "Product H (Stone)", "Product I (Paper)",
                "Product J (Leather)", "Product K (Concrete)", "Product L (Brick)",
                "Product M (Tile)", "Product N (Paint)", "Product O (Adhesive)",
                "Product P (Sealant)", "Product Q (Wire)", "Product R (Pipe)",
                "Product S (Valve)", "Product T (Pump)"
            ];
            showToast('Using mock product data due to fetch error.', 'info');
        }
    }

    // Call fetchProducts when the modal is about to be shown or on page load
    raisePurchaseRequestBtn.addEventListener('click', async () => {
        purchaseRequestModal.style.display = 'block';
        if (typeof isModalOpen !== 'undefined') {
            isModalOpen = true;
        }
        // Fetch products only if not already fetched or if you want to refresh
        if (allProducts.length === 0) {
            await fetchProducts();
        }
        itemSearchInput.focus(); // Focus on the search input when modal opens
    });

    // Handle search input
    itemSearchInput.addEventListener('input', () => {
        const searchTerm = itemSearchInput.value.toLowerCase();
        itemSearchResults.innerHTML = ''; // Clear previous results

        if (searchTerm.length > 0) {
            const filteredProducts = allProducts.filter(product =>
                product.toLowerCase().includes(searchTerm)
            );

            if (filteredProducts.length > 0) {
                filteredProducts.forEach(product => {
                    const resultItem = document.createElement('div');
                    resultItem.classList.add('search-result-item');
                    resultItem.textContent = product;

                    // Add a checkmark icon
                    const selectIcon = document.createElement('span');
                    selectIcon.classList.add('select-icon', 'fas', 'fa-check');
                    resultItem.appendChild(selectIcon);

                    // Add 'selected' class if already in temporary selection
                    if (searchSelectedProducts.has(product)) {
                        resultItem.classList.add('selected');
                    }

                    resultItem.addEventListener('click', () => {
                        if (searchSelectedProducts.has(product)) {
                            searchSelectedProducts.delete(product);
                            resultItem.classList.remove('selected');
                        } else {
                            searchSelectedProducts.add(product);
                            resultItem.classList.add('selected');
                        }
                    });
                    itemSearchResults.appendChild(resultItem);
                });
                itemSearchResults.classList.add('show');
            } else {
                const noResult = document.createElement('div');
                noResult.classList.add('search-result-item');
                noResult.textContent = 'No items found.';
                itemSearchResults.appendChild(noResult);
                itemSearchResults.classList.add('show');
            }
        } else {
            itemSearchResults.classList.remove('show');
        }
    });

    // Close search results when clicking outside
    document.addEventListener('click', (event) => {
        if (!itemSearchInput.contains(event.target) && !itemSearchResults.contains(event.target)) {
            itemSearchResults.classList.remove('show');
        }
    });

    // Add selected items to the final list
    addSelectedItemsBtn.addEventListener('click', () => {
        if (searchSelectedProducts.size === 0) {
            showToast('Please select at least one item.', 'info');
            return;
        }

        searchSelectedProducts.forEach(productName => {
            // Add to finalSelectedItems only if not already present
            if (!finalSelectedItems.some(item => item.name === productName)) {
                finalSelectedItems.push({ name: productName, qty: 1 }); // Default quantity to 1
            }
        });

        // Sort items alphabetically for consistent display
        finalSelectedItems.sort((a, b) => a.name.localeCompare(b.name));

        renderFinalSelectedItems(); // Re-render the display
        itemSearchInput.value = ''; // Clear search input
        itemSearchResults.innerHTML = ''; // Clear search results
        itemSearchResults.classList.remove('show');
        searchSelectedProducts.clear(); // Clear temporary selection after adding
        showToast('Items added to list!', 'success');
    });

    // Render the final selected items with quantity inputs
    function renderFinalSelectedItems() {
        selectedItemsDisplay.innerHTML = ''; // Clear existing display
        if (finalSelectedItems.length > 0) {
            selectedItemsDisplay.style.display = 'block'; // Show the container

            finalSelectedItems.forEach(item => {
                const itemRow = document.createElement('div');
                itemRow.classList.add('selected-item-row');
                itemRow.dataset.itemName = item.name; // Store item name for easy lookup

                const itemNameSpan = document.createElement('span');
                itemNameSpan.classList.add('selected-item-name');
                itemNameSpan.textContent = item.name;
                itemRow.appendChild(itemNameSpan);

                const qtyInput = document.createElement('input');
                qtyInput.type = 'number';
                qtyInput.min = '1';
                qtyInput.value = item.qty;
                qtyInput.classList.add('selected-item-qty-input');
                qtyInput.addEventListener('change', (e) => {
                    const newQty = parseInt(e.target.value);
                    if (!isNaN(newQty) && newQty >= 1) {
                        item.qty = newQty; // Update quantity in the array
                    } else {
                        e.target.value = item.qty; // Revert to previous valid quantity
                    }
                });
                itemRow.appendChild(qtyInput);

                const removeButton = document.createElement('button');
                removeButton.classList.add('remove-item-btn', 'fas', 'fa-times-circle');
                removeButton.title = 'Remove item';
                removeButton.addEventListener('click', () => {
                    finalSelectedItems = finalSelectedItems.filter(i => i.name !== item.name);
                    renderFinalSelectedItems(); // Re-render after removal
                    showToast(`${item.name} removed.`, 'info');
                });
                itemRow.appendChild(removeButton);

                selectedItemsDisplay.appendChild(itemRow);
            });
        } else {
            selectedItemsDisplay.style.display = 'none'; // Hide if no items
        }
    }


    // Handle form submission
    purchaseRequestForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        if (finalSelectedItems.length === 0) {
            showToast('Please select at least one item and specify quantity.', 'error');
            return;
        }

        // Show loading spinner and disable button
        prLoadingSpinner.style.display = 'inline-block';
        submitPrButton.disabled = true;
        submitPrButton.textContent = 'Sending...';

        const dealerName = document.getElementById('dealer-name').value;
        const priorityLevel = document.getElementById('priority-level').value;
        const remarks = document.getElementById('remarks').value;
        const requestDate = new Date().toLocaleDateString('en-US'); // Format as MM/DD/YYYY

        // Prepare the items array for the payload
        const itemsPayload = finalSelectedItems.map(item => ({
            'Item': item.name,
            'Quantity': item.qty
        }));

        const formData = {
            'Dealer Name': dealerName,
            'Request Date': requestDate,
            'Priority Level': priorityLevel,
            'Remarks': remarks,
            'Requested Items': itemsPayload // Send the array of items and quantities
        };

        const googleAppsScriptUrl = 'https://script.google.com/macros/s/AKfycbyffY1_V3ap0VOnFJ8tIPP5bR_gy_cVQ8_WmLpu0Q6E_dzHOUDPbdXnP4Db5gXRxly/exec'; // Your existing POST URL

        try {
            const response = await fetch(googleAppsScriptUrl, {
                method: 'POST',
                mode: 'no-cors', // Use 'no-cors' for Google Apps Script to avoid CORS issues on client-side
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            // In 'no-cors' mode, response.ok will always be false and response.status will be 0.
            // We rely on the fetch completing without throwing a network error.
            // A more robust solution would involve a server-side proxy or CORS configuration on the Apps Script.

            showToast('Purchase request sent!', 'success');
            closeModal(); // Close the modal

        } catch (error) {
            // This catches network errors (e.g., no internet, script URL typo)
            console.error('Error sending purchase request:', error);
            showToast('Failed to send request. Check connection or script URL.', 'error');
        } finally {
            // Always re-enable button and hide spinner
            prLoadingSpinner.style.display = 'none';
            submitPrButton.disabled = false;
            submitPrButton.textContent = 'Submit Request';
        }
    });
});
