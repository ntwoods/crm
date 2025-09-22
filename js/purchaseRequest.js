document.addEventListener('DOMContentLoaded', () => {
  const purchaseRequestModal = document.getElementById('purchase-request-modal');
  const raisePurchaseRequestBtn = document.getElementById('raise-purchase-request-btn');
  const closePurchaseRequest = document.getElementById('close-purchase-request');
  const itemSelector = document.getElementById('item-selector');
  const categorySelector = document.getElementById('category-selector');
  const qtySection = document.getElementById('qty-input-section');
  const qtyFieldsContainer = document.getElementById('qty-fields-container');
  const submitBtn = document.getElementById('submit-purchase-request');
  const loadingSpinner = document.getElementById('pr-loading-spinner');

  let choicesInstance = null;
  let categoryChoices = null;
  let allIMSData = []; // store full IMS rows for category filtering

  raisePurchaseRequestBtn.addEventListener('click', () => {
    purchaseRequestModal.style.display = 'block';
    fetchItemListFromSheet();
  });

  closePurchaseRequest.addEventListener('click', () => {
    purchaseRequestModal.style.display = 'none';
    resetForm();
  });

  async function fetchItemListFromSheet() {
    try {
      const url = 'https://docs.google.com/spreadsheets/d/1UeohB4IPgEzGwybOJaIKpCIa38A4UvBstM8waqYv9V0/gviz/tq?tqx=out:csv&sheet=IMS';
      const response = await fetch(url);
      const data = await response.text();

      // Parse CSV (skip headers)
      const rows = data.split('\n').slice(2);
      allIMSData = rows
        .map(row => row.split(','))
        .filter(r => r[1] && r[2]); // ensure category and product present

      populateCategoryDropdown();
    } catch (error) {
      showToast('Error fetching IMS data', 'error');
    }
  }

  function populateCategoryDropdown() {
    const uniqueCategories = [...new Set(allIMSData.map(r => r[1].trim()))].sort();
    categorySelector.innerHTML = uniqueCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('');

    if (categoryChoices) categoryChoices.destroy();
    categoryChoices = new Choices(categorySelector, {
      searchEnabled: true,
      allowHTML: false,
      placeholder: true,
      placeholderValue: 'Select category...'
    });

    categorySelector.addEventListener('change', handleCategoryChange);
    handleCategoryChange(); // populate default products based on first category
  }

  function handleCategoryChange() {
    const selectedCategory = categorySelector.value;
    const filteredProducts = allIMSData
      .filter(r => r[1].trim() === selectedCategory)
      .map(r => r[2].trim());

    populateItemDropdown(filteredProducts);
  }

  function populateItemDropdown(items) {
    itemSelector.innerHTML = '';
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item;
      opt.textContent = item;
      itemSelector.appendChild(opt);
    });

    if (choicesInstance) choicesInstance.destroy();
    choicesInstance = new Choices(itemSelector, {
      removeItemButton: true,
      searchEnabled: true,
      placeholder: true,
      placeholderValue: 'Search products...',
      maxItemCount: 100,
      allowHTML: false
    });
  }

  document.getElementById('next-btn').addEventListener('click', () => {
    const selectedItems = choicesInstance.getValue(true); // get array of selected values
    if (!selectedItems.length) {
      showToast('Please select at least one product', 'info');
      return;
    }

    qtyFieldsContainer.innerHTML = '';
    selectedItems.forEach(item => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('qty-field');
      const label = document.createElement('label');
      label.textContent = item;
      const input = document.createElement('input');
      input.type = 'number';
      input.min = 1;
      input.required = true;
      input.dataset.item = item;
      wrapper.appendChild(label);
      wrapper.appendChild(input);
      qtyFieldsContainer.appendChild(wrapper);
    });

    qtySection.style.display = 'block';
  });

  submitBtn.addEventListener('click', async () => {
    const dealerName = document.getElementById('dealer-name').value.trim();
    const priority = document.getElementById('priority-level').value;
    const remarks = document.getElementById('remarks').value.trim();

    const qtyInputs = qtyFieldsContainer.querySelectorAll('input');
    const itemsObj = {};
    for (const input of qtyInputs) {
      const val = parseInt(input.value);
      if (isNaN(val) || val <= 0) {
        showToast(`Enter a valid quantity for ${input.dataset.item}`, 'error');
        return;
      }
      itemsObj[input.dataset.item] = val;
    }

    if (!dealerName) {
      showToast('Dealer Name is required', 'error');
      return;
    }

    const formData = {
      'Dealer Name': dealerName,
      'Priority Level': priority,
      'Remarks': remarks,
      'CRM Name': localStorage.getItem('crmName') || '',
      'Request Date': new Date().toLocaleString(),
      'Requested Items': itemsObj
    };

    try {
      loadingSpinner.style.display = 'block';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      await fetch('https://script.google.com/macros/s/AKfycbyffY1_V3ap0VOnFJ8tIPP5bR9_gy_cVQ8_WmLpu0Q6E_dzHOUDPbdXnP4Db5gXRyxl/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      showToast('Purchase Request Submitted Successfully!', 'success');
      purchaseRequestModal.style.display = 'none';
      resetForm();
    } catch (error) {
      showToast('Error submitting purchase request', 'error');
    } finally {
      loadingSpinner.style.display = 'none';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Request';
    }
  });

  function resetForm() {
    if (choicesInstance) choicesInstance.destroy();
    if (categoryChoices) categoryChoices.destroy();
    itemSelector.innerHTML = '';
    categorySelector.innerHTML = '';
    qtySection.style.display = 'none';
    qtyFieldsContainer.innerHTML = '';
    document.getElementById('dealer-name').value = '';
    document.getElementById('remarks').value = '';
    allIMSData = [];
  }

  function showToast(message, type) {
    // simple console toast (replace with your real toast implementation)
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
});
