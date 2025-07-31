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

    let choicesInstance = null;

    // Load items and initialize dropdown
// Fetch and initialize dropdown from sheet
async function fetchItemListFromSheet() {
    const url = 'https://docs.google.com/spreadsheets/d/1UeohB4IPgEzGwybOJaIKpCIa38A4UvBstM8waqYv9V0/gviz/tq?tqx=out:csv&sheet=IMS';
    try {
        const response = await fetch(url);
        const csvText = await response.text();
        const rows = csvText.split('\n').slice(2); // skip headers
        const items = rows
            .map(row => row.split(',')[2])
            .filter(item => item && item.trim() !== '')
            .map(item => ({ value: item.trim(), label: item.trim() }));

        initChoicesDropdown(items);
    } catch (error) {
        console.error('Failed to fetch item list:', error);
        showToast('Failed to load item list.', 'error');
    }
}

// Initialize Choices dropdown with dynamic + free entry support
function initChoicesDropdown(itemsArray) {
    const selectEl = document.getElementById('item-selector');
    if (choicesInstance) choicesInstance.destroy();

    choicesInstance = new Choices(selectEl, {
        removeItemButton: true,
        searchEnabled: true,
        placeholderValue: 'Search and select items',
        noResultsText: (value) => `Press Enter to add: "${value}"`,
        duplicateItemsAllowed: false,
        shouldSort: true,
        paste: false,
        addItems: true, // This is key for adding new items
        addItemFilter: (value) => value.trim().length > 0,
        addItemText: (value) => `Press Enter to add: "${value}"`,
    });

    // Now populate items
    choicesInstance.setChoices(itemsArray, 'value', 'label', true);

    // *** REMOVE THE inputWatcher BLOCK ***
    // The native Choices.js 'addItems: true' handles the adding on Enter.
    // Manual intervention here is redundant and can cause issues with how Choices.js manages its internal state.
}

    // Toast message
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
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    }

    // Modal show/hide
    raisePurchaseRequestBtn.addEventListener('click', () => {
        purchaseRequestModal.style.display = 'block';
        isModalOpen = true; // Make sure 'isModalOpen' is defined if used elsewhere
        fetchItemListFromSheet();
    });

    const closeModal = () => {
        purchaseRequestModal.style.display = 'none';
        purchaseRequestForm.reset();
        qtySection.style.display = 'none';
        qtyFieldsContainer.innerHTML = '';
        // isModalOpen = false; // Make sure 'isModalOpen' is defined if used elsewhere
        prLoadingSpinner.style.display = 'none';
        submitPrButton.disabled = false;
        submitPrButton.textContent = 'Submit Request';
        if (choicesInstance) choicesInstance.clearStore();
    };

    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === purchaseRequestModal) closeModal();
    });

    // ✅ NEXT button logic
    proceedToQtyBtn.addEventListener('click', () => {
      const selectedOptions = choicesInstance.getValue(); // This will now include both pre-defined and custom-added items
    
      if (!selectedOptions || selectedOptions.length === 0) {
        showToast('Please select at least one item.', 'error');
        return;
      }
    
      qtyFieldsContainer.innerHTML = ''; // Clear old inputs
    
      selectedOptions.forEach(option => {
        const item = option.value?.trim();
        if (!item) return;
    
        const safeId = item.replace(/\W+/g, '-').toLowerCase();
    
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '1';
        input.required = true;
        input.placeholder = 'Quantity';
        input.style.width = '100%';
        input.style.marginBottom = '10px';
        input.setAttribute('data-item', item);
        input.setAttribute('id', `qty-${safeId}`);
    
        const label = document.createElement('label');
        label.setAttribute('for', `qty-${safeId}`);
        label.textContent = item;
    
        const wrapper = document.createElement('div');
        wrapper.appendChild(label);
        wrapper.appendChild(input);
    
        qtyFieldsContainer.appendChild(wrapper);
      });
    
      qtySection.style.display = 'block';
    });

    // ✅ Final form submit logic
    purchaseRequestForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        prLoadingSpinner.style.display = 'block';
        submitPrButton.disabled = true;
        submitPrButton.textContent = 'Submitting...';

        const dealerName = document.getElementById('dealer-name').value.trim();
        const priorityLevel = document.getElementById('priority-level').value;
        const remarks = document.getElementById('remarks').value.trim();
        const crmName = window.CRM_NAME;
        const requestDate = new Date().toLocaleString();

        const qtyInputs = document.querySelectorAll('#qty-fields-container input');
        let itemQtyMap = {};

        qtyInputs.forEach(input => {
            const item = input.getAttribute('data-item')?.trim();
            const qty = parseInt(input.value.trim());

            if (!item || isNaN(qty) || qty <= 0) {
                showToast(`Invalid quantity for ${item || 'unknown item'}`, 'error');
                // You might want to prevent form submission here or highlight the invalid input
                // For now, let's just log and continue, but a more robust error handling is recommended.
                return; // Skip this invalid item
            }

            itemQtyMap[item] = qty;
        });

        if (Object.keys(itemQtyMap).length === 0) {
            showToast('No valid items with quantities to submit.', 'error');
            prLoadingSpinner.style.display = 'none';
            submitPrButton.disabled = false;
            submitPrButton.textContent = 'Submit Request';
            return; // Stop submission if no items are present
        }

        const formData = {
            'Dealer Name': dealerName,
            'Priority Level': priorityLevel,
            'Remarks': remarks,
            'CRM Name': crmName,
            'Request Date': requestDate,
            'Requested Items': itemQtyMap // This will now include custom items
        };

        const googleAppsScriptUrl = 'https://script.google.com/macros/s/AKfycbyffY1_V3ap0VOnFJ8tIPP5bR9_gy_cVQ8_WmLpu0Q6E_dzHOUDPbdXnP4Db5gXRyxl/exec';

        try {
            await fetch(googleAppsScriptUrl, {
                method: 'POST',
                mode: 'no-cors', // Important for Google Apps Script
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            showToast('Purchase request sent!', 'success');
            closeModal();

        } catch (error) {
            console.error('Error sending purchase request:', error);
            showToast('Failed to send request. Check connection.', 'error');
            prLoadingSpinner.style.display = 'none';
            submitPrButton.disabled = false;
            submitPrButton.textContent = 'Submit Request';
        }
    });
});
