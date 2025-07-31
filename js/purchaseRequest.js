// GLOBAL variable defined (ensure this is accessible)
document.addEventListener('DOMContentLoaded', () => {
    const raisePurchaseRequestBtn = document.getElementById('raise-purchase-request-btn');
    const purchaseRequestModal = document.getElementById('purchase-request-modal');
    const closeButton = purchaseRequestModal.querySelector('.close-button');
    const purchaseRequestForm = document.getElementById('purchase-request-form');
    const submitPrButton = document.getElementById('submit-pr-button');
    const prLoadingSpinner = document.getElementById('pr-loading-spinner');
    const proceedToQtyBtn = document.getElementById('proceed-to-qty-btn');
    const qtySection = document.getElementById('qty-input-section');
    const qtyFieldsContainer = document.getElementById('qty-fields-container');

    let choicesInstance = null; // Initialize choicesInstance outside functions for broader scope

    // Helper to show toast messages
    function showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            // Remove toast after transition ends to prevent layout shifts
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    }

    // Fetch item list from Google Sheet and initialize Choices.js dropdown
    async function fetchItemListFromSheet() {
        // Ensure this URL is correct and publicly accessible for CSV export
        const url = 'https://docs.google.com/spreadsheets/d/1UeohB4IPgEzGwybOJaIKpCIa38A4UvBstM8waqYv9V0/gviz/tq?tqx=out:csv&sheet=IMS';
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            // Split by new line, skip potential BOM and header rows (assuming 2 header rows)
            const rows = csvText.split('\n').slice(2); 
            const items = rows
                .map(row => row.split(',')[2]) // Assuming item name is in the 3rd column (index 2)
                .filter(item => item && item.trim() !== '') // Filter out empty or undefined items
                .map(item => ({ value: item.trim(), label: item.trim() })); // Create Choices.js compatible objects

            initChoicesDropdown(items);
        } catch (error) {
            console.error('Failed to fetch item list:', error);
            showToast('Failed to load item list. Please check console for details.', 'error');
        }
    }

    // Initialize Choices.js dropdown
    function initChoicesDropdown(itemsArray) {
        const selectEl = document.getElementById('item-selector');
        // Destroy existing instance to prevent re-initialization issues
        if (choicesInstance) {
            choicesInstance.destroy();
        }

        choicesInstance = new Choices(selectEl, {
            removeItemButton: true, // Allows removal of selected items
            searchEnabled: true, // Enables searching
            placeholderValue: 'Search and select or add new items', // Custom placeholder
            noResultsText: (value) => `No results found. Press Enter to add: "${value}"`, // Message when no results
            duplicateItemsAllowed: false, // Prevents adding the same item multiple times
            shouldSort: true, // Sorts items alphabetically
            paste: false, // Disables pasting into the search box
            addItems: true, // Crucial: Allows adding new items on the fly
            addItemFilter: (value) => value.trim().length > 0, // Only allow non-empty items to be added
            addItemText: (value) => `Press Enter to add: "${value}"`, // Text for adding new item
        });

        // Set choices after initialization
        choicesInstance.setChoices(itemsArray, 'value', 'label', true);
        
        // No need for custom inputWatcher. Choices.js handles 'Enter' for addItems: true
    }

    // Event listener for opening the modal
    raisePurchaseRequestBtn.addEventListener('click', () => {
        purchaseRequestModal.style.display = 'block';
        // You might want to define `isModalOpen` globally or remove if not used elsewhere
        // isModalOpen = true; 
        fetchItemListFromSheet(); // Fetch items every time modal opens
    });

    // Function to close and reset the modal
    const closeModal = () => {
        purchaseRequestModal.style.display = 'none';
        purchaseRequestForm.reset(); // Reset form fields
        qtySection.style.display = 'none'; // Hide quantity section
        qtyFieldsContainer.innerHTML = ''; // Clear dynamically added quantity inputs
        // isModalOpen = false; 
        prLoadingSpinner.style.display = 'none'; // Hide loading spinner
        submitPrButton.disabled = false; // Enable submit button
        submitPrButton.textContent = 'Submit Request'; // Reset button text
        if (choicesInstance) {
            choicesInstance.clearStore(); // Clear all selected and available choices
            choicesInstance.setChoices([], 'value', 'label', true); // Reset choices to empty
        }
    };

    // Event listeners for closing the modal
    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === purchaseRequestModal) {
            closeModal();
        }
    });

    // Logic for "Next" button (Proceed to Quantity)
    proceedToQtyBtn.addEventListener('click', () => {
        const selectedOptions = choicesInstance.getValue(); // Get all selected items (including custom ones)

        if (!selectedOptions || selectedOptions.length === 0) {
            showToast('Please select at least one item.', 'error');
            return;
        }

        qtyFieldsContainer.innerHTML = ''; // Clear previous quantity inputs

        selectedOptions.forEach(option => {
            const item = option.value?.trim();
            if (!item) return; // Skip if item value is empty

            // Create a safe ID for label and input association
            const safeId = `qty-${item.replace(/\W+/g, '-').toLowerCase()}`;

            const wrapper = document.createElement('div');
            wrapper.className = 'qty-input-wrapper'; // Add a class for potential styling

            const label = document.createElement('label');
            label.setAttribute('for', safeId);
            label.textContent = item;

            const input = document.createElement('input');
            input.type = 'number';
            input.min = '1';
            input.required = true;
            input.placeholder = 'Quantity';
            input.style.width = '100%';
            input.style.marginBottom = '10px';
            input.setAttribute('data-item', item); // Store original item name
            input.setAttribute('id', safeId);

            wrapper.appendChild(label);
            wrapper.appendChild(input);
            qtyFieldsContainer.appendChild(wrapper);
        });

        qtySection.style.display = 'block'; // Show the quantity input section
    });

    // Final form submission logic
    purchaseRequestForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        prLoadingSpinner.style.display = 'block'; // Show loading spinner
        submitPrButton.disabled = true; // Disable submit button
        submitPrButton.textContent = 'Submitting...'; // Change button text

        const dealerName = document.getElementById('dealer-name').value.trim();
        const priorityLevel = document.getElementById('priority-level').value;
        const remarks = document.getElementById('remarks').value.trim();
        const crmName = window.CRM_NAME; // Assuming CRM_NAME is globally available
        const requestDate = new Date().toLocaleString(); // Current date and time

        const qtyInputs = document.querySelectorAll('#qty-fields-container input');
        let itemQtyMap = {};
        let hasInvalidQty = false;

        qtyInputs.forEach(input => {
            const item = input.getAttribute('data-item')?.trim();
            const qty = parseInt(input.value.trim());

            if (!item || isNaN(qty) || qty <= 0) {
                showToast(`Invalid quantity for ${item || 'an item'}. Please enter a positive number.`, 'error');
                hasInvalidQty = true;
                // Highlight the invalid input if possible, e.g., input.style.border = '1px solid red';
            } else {
                itemQtyMap[item] = qty;
            }
        });

        if (hasInvalidQty) {
            prLoadingSpinner.style.display = 'none';
            submitPrButton.disabled = false;
            submitPrButton.textContent = 'Submit Request';
            return; // Stop submission if any quantity is invalid
        }

        if (Object.keys(itemQtyMap).length === 0) {
            showToast('No valid items with quantities to submit. Please select items and enter quantities.', 'error');
            prLoadingSpinner.style.display = 'none';
            submitPrButton.disabled = false;
            submitPrButton.textContent = 'Submit Request';
            return;
        }

        const formData = {
            'Dealer Name': dealerName,
            'Priority Level': priorityLevel,
            'Remarks': remarks,
            'CRM Name': crmName,
            'Request Date': requestDate,
            'Requested Items': itemQtyMap // This will contain all selected items with quantities
        };

        // Your Google Apps Script Web App URL
        const googleAppsScriptUrl = 'https://script.google.com/macros/s/AKfycbyffY1_V3ap0VOnFJ8tIPP5bR9_gy_cVQ8_WmLpu0Q6E_dzHOUDPbdXnP4Db5gXRyxl/exec';

        try {
            const response = await fetch(googleAppsScriptUrl, {
                method: 'POST',
                mode: 'no-cors', // Required for Google Apps Script web apps to avoid CORS issues
                headers: { 'Content-Type': 'application/json' }, // Specify content type
                body: JSON.stringify(formData) // Send data as JSON string
            });

            // Note: With 'no-cors' mode, you cannot read the response body or status directly.
            // A successful fetch() call here simply means the request was sent without network errors.
            // You'll rely on the Google Apps Script side to confirm data receipt.

            showToast('Purchase request sent successfully!', 'success');
            closeModal(); // Close modal on successful submission

        } catch (error) {
            console.error('Error sending purchase request:', error);
            showToast('Failed to send request. Please check your internet connection or try again.', 'error');
            // Re-enable button and hide spinner on error
            prLoadingSpinner.style.display = 'none';
            submitPrButton.disabled = false;
            submitPrButton.textContent = 'Submit Request';
        }
    });
});
