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
    async function fetchItemListFromSheet() {
        const url = 'https://docs.google.com/spreadsheets/d/1UeohB4IPgEzGwybOJaIKpCIa38A4UvBstM8waqYv9V0/gviz/tq?tqx=out:csv&sheet=IMS';
        try {
            const response = await fetch(url);
            const csvText = await response.text();
            const rows = csvText.split('\n').slice(2); // skip headers
            const items = rows.map(row => row.split(',')[2]).filter(item => item && item.trim() !== '');

            const selector = document.getElementById('item-selector');
            selector.innerHTML = '';

            items.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item;
                opt.textContent = item;
                selector.appendChild(opt);
            });

            initChoicesDropdown();
        } catch (error) {
            console.error('Failed to fetch item list:', error);
            showToast('Failed to load item list.', 'error');
        }
    }

    function initChoicesDropdown() {
        const selectEl = document.getElementById('item-selector');
        if (choicesInstance) choicesInstance.destroy();

        choicesInstance = new Choices(selectEl, {
            removeItemButton: true,
            searchEnabled: true,
            placeholderValue: 'Search and select items',
            noResultsText: 'No items found',
            itemSelectText: '',
            maxItemCount: 100
        });
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
        isModalOpen = true;
        fetchItemListFromSheet();
    });

    const closeModal = () => {
        purchaseRequestModal.style.display = 'none';
        purchaseRequestForm.reset();
        qtySection.style.display = 'none';
        qtyFieldsContainer.innerHTML = '';
        isModalOpen = false;
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
      const selectedOptions = choicesInstance.getValue(); // returns array of {value: "...", label: "..."}
    
      if (!selectedOptions || selectedOptions.length === 0) {
        showToast('Please select at least one item.', 'error');
        return;
      }
    
      qtyFieldsContainer.innerHTML = '';
    
      selectedOptions.forEach(option => {
        const item = option.value;
        const div = document.createElement('div');
        div.innerHTML = `
          <label>${item}</label>
          <input type="number" data-item="${item}" min="1" placeholder="Qty" required style="width: 100%; margin-bottom: 12px;" />
        `;
        qtyFieldsContainer.appendChild(div);
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
        
        for (const input of qtyInputs) {
          const item = input.getAttribute('data-item');
          const qty = input.value.trim();
        
          if (!item || !qty || isNaN(qty) || parseInt(qty) <= 0) {
            showToast(`Enter valid quantity for ${item || 'unknown item'}`, 'error');
            prLoadingSpinner.style.display = 'none';
            submitPrButton.disabled = false;
            submitPrButton.textContent = 'Submit Request';
            return;
          }
        
          itemQtyMap[item] = parseInt(qty);
        }

        const formData = {
            'Dealer Name': dealerName,
            'Priority Level': priorityLevel,
            'Remarks': remarks,
            'CRM Name': crmName,
            'Request Date': requestDate,
            'Requested Items': itemQtyMap
        };

        const googleAppsScriptUrl = 'https://script.google.com/macros/s/AKfycbyffY1_V3ap0VOnFJ8tIPP5bR9_gy_cVQ8_WmLpu0Q6E_dzHOUDPbdXnP4Db5gXRyxl/exec';

        try {
            await fetch(googleAppsScriptUrl, {
                method: 'POST',
                mode: 'no-cors',
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
