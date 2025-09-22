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
    const addCustomItemBtn = document.getElementById('add-custom-item-btn');

    // New elements for Category
    const categorySelectEl = document.getElementById('category-selector');
    const itemSelectEl = document.getElementById('item-selector');

    // Choices instances
    let itemChoices = null;
    let categoryChoices = null;

    // Data caches
    let allItems = []; // ["Item A", "Item B", ...]
    let categories = []; // ["PVC Door", "Laminates", ...]
    let productsByCategory = {}; // { "PVC Door": ["P1", "P2"], ... }

    // Load categories & items and initialize dropdowns
    async function fetchIMSDataAndInit() {
        const url = 'https://docs.google.com/spreadsheets/d/1UeohB4IPgEzGwybOJaIKpCIa38A4UvBstM8waqYv9V0/gviz/tq?tqx=out:csv&sheet=IMS';
        try {
            const response = await fetch(url);
            const csvText = await response.text();
            const rows = csvText.split('\n').slice(2); // skip headers (kept as in existing logic)

            const catSet = new Set();
            const prodSet = new Set();
            productsByCategory = {};

            rows.forEach(r => {
                if (!r.trim()) return;
                const cols = r.split(',');
                const cat = (cols[1] || '').trim(); // Column B
                const prod = (cols[2] || '').trim(); // Column C
                if (!cat && !prod) return;

                if (cat) catSet.add(cat);
                if (prod) prodSet.add(prod);

                if (cat && prod) {
                    if (!productsByCategory[cat]) productsByCategory[cat] = [];
                    productsByCategory[cat].push(prod);
                }
            });

            categories = Array.from(catSet).sort((a,b) => a.localeCompare(b));
            allItems = Array.from(prodSet).sort((a,b) => a.localeCompare(b));

            initCategoryChoices(categories);
            initItemChoices(allItems); // start with full list; will filter after category selection
        } catch (error) {
            console.error('Failed to fetch IMS data:', error);
            showToast('Failed to load categories/products.', 'error');
        }
    }

    function initCategoryChoices(options) {
        // Destroy old instance if any
        if (categoryChoices) categoryChoices.destroy();
        // Reset DOM options
        categorySelectEl.innerHTML = '';
        // Placeholder option
        const placeholderOpt = document.createElement('option');
        placeholderOpt.value = '';
        placeholderOpt.textContent = 'Select a category';
        categorySelectEl.appendChild(placeholderOpt);
        // Add options
        options.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            categorySelectEl.appendChild(opt);
        });
        // Create Choices instance
        categoryChoices = new Choices(categorySelectEl, {
            searchEnabled: true,
            removeItemButton: false,
            placeholderValue: 'Search a category',
            allowHTML: false,
            itemSelectText: '',
            shouldSort: false
        });

        // On change → filter items
        categorySelectEl.addEventListener('change', () => {
            const selectedCat = categorySelectEl.value;
            if (selectedCat && productsByCategory[selectedCat]) {
                const list = productsByCategory[selectedCat].slice().sort((a,b) => a.localeCompare(b));
                setItemChoices(list);
            } else {
                setItemChoices(allItems);
            }
        });
    }

    function initItemChoices(options) {
        if (itemChoices) itemChoices.destroy();
        itemSelectEl.innerHTML = '';
        options.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item;
            opt.textContent = item;
            itemSelectEl.appendChild(opt);
        });
        itemChoices = new Choices(itemSelectEl, {
            removeItemButton: true,
            searchEnabled: true,
            placeholderValue: 'Search and select items or type a new one',
            noResultsText: 'Type to add as a new item.',
            itemSelectText: '',
            maxItemCount: 100,
            allowHTML: false,
            // Allow free text via our custom button below
            createTag: true,
        });
    }

    function setItemChoices(options) {
        if (!itemChoices) return initItemChoices(options);
        // Reset choices with new list while preserving selected where possible
        const selectedValues = itemChoices.getValue(true);
        itemChoices.clearStore();
        itemChoices.setChoices(
            options.map(v => ({ value: v, label: v })),
            'value',
            'label',
            true
        );
        // Re-select items that still exist
        selectedValues.forEach(v => {
            if (options.includes(v)) {
                itemChoices.setChoiceByValue(v);
            }
        });
    }

    // Event listener for the new "Add Custom Item" button
    addCustomItemBtn.addEventListener('click', () => {
        const customItemInput = itemChoices?.input?.element?.value?.trim();
        if (customItemInput) {
            const currentItems = itemChoices.getValue(true);
            if (!currentItems.includes(customItemInput)) {
                itemChoices.setChoices([{ value: customItemInput, label: customItemInput, selected: true }], 'value', 'label', true);
                itemChoices.input.element.value = '';
                showToast(`'${customItemInput}' added as a custom item.`, 'success');
            } else {
                showToast(`'${customItemInput}' is already selected.`, 'info');
            }
        } else {
            showToast('Please type a custom item name to add.', 'error');
        }
    });

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
        // Populate categories & items fresh each open
        fetchIMSDataAndInit();
        // Reset qty section on open
        qtySection.style.display = 'none';
        qtyFieldsContainer.innerHTML = '';
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
        if (itemChoices) itemChoices.clearStore();
        if (categoryChoices) categoryChoices.clearStore();
    };

    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === purchaseRequestModal) closeModal();
    });

    // NEXT button logic → build quantity inputs for selected items
    proceedToQtyBtn.addEventListener('click', () => {
      const selectedOptions = itemChoices.getValue(); // [{ value, label }]
      if (!selectedOptions || selectedOptions.length === 0) {
        showToast('Please select at least one item.', 'error');
        return;
      }

      qtyFieldsContainer.innerHTML = '';

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

    // Final form submit logic (unchanged payload structure)
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

        try {
            qtyInputs.forEach(input => {
              const item = input.getAttribute('data-item')?.trim();
              const qty = parseInt(input.value.trim());

              if (!item || isNaN(qty) || qty <= 0) {
                showToast(`Invalid quantity for ${item || 'unknown item'}`, 'error');
                throw new Error('Invalid qty input');
              }

              itemQtyMap[item] = qty;
            });
        } catch (e) {
            prLoadingSpinner.style.display = 'none';
            submitPrButton.disabled = false;
            submitPrButton.textContent = 'Submit Request';
            return; // Stop the submission if quantity is invalid
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
