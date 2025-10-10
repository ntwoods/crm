// GLOBAL variable defined in crm.html to manage auto-reload
// window.isModalOpen

document.addEventListener('DOMContentLoaded', () => {
  const registerClaimBtn = document.getElementById('register-claim-request-btn');
  const claimRequestModal = document.getElementById('claim-request-modal');
  const closeClaimBtn = document.getElementById('close-claim-modal-btn');
  const claimRequestForm = document.getElementById('claim-request-form');
  const submitClaimButton = document.getElementById('submit-claim-button');
  const claimLoadingSpinner = document.getElementById('claim-loading-spinner');

  const addRowBtn = document.getElementById('add-product-row');
  const productsTbody = document.getElementById('products-tbody');

  // ========= Modal open/close =========
  registerClaimBtn.addEventListener('click', () => {
    claimRequestModal.style.display = 'block';
    isModalOpen = true;

    // Ensure at least one row on open
    if (productsTbody.querySelectorAll('tr.item-row').length === 0) {
      addProductRow();
      renumberRows();
    }
  });

  const closeClaimModal = () => {
    claimRequestModal.style.display = 'none';
    // Clear the form
    claimRequestForm.reset();
    // Clear table rows
    productsTbody.innerHTML = '';
    isModalOpen = false;
    claimLoadingSpinner.style.display = 'none';
    submitClaimButton.disabled = false;
    submitClaimButton.textContent = 'Submit Claim';
  };

  closeClaimBtn.addEventListener('click', closeClaimModal);
  window.addEventListener('click', (event) => {
    if (event.target === claimRequestModal) {
      closeClaimModal();
    }
  });

  // ========= Dynamic Rows =========
  function addProductRow(prefill = {}) {
    const tr = document.createElement('tr');
    tr.className = 'item-row';
    tr.innerHTML = `
      <td class="row-idx" style="padding:10px;border-bottom:1px solid #eef2f7;">#</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eef2f7;">
        <input type="text" class="prod-input" placeholder="Product" required
               value="${prefill.product ?? ''}" style="width:100%;">
      </td>
      <td style="padding:6px 8px;border-bottom:1px solid #eef2f7;">
        <input type="text" class="details-input" placeholder="Details" 
               value="${prefill.details ?? ''}" style="width:100%;">
      </td>
      <td style="padding:6px 8px;border-bottom:1px solid #eef2f7;">
        <input type="number" class="qty-input" placeholder="Qty" min="1" required
               value="${prefill.qty ?? ''}" style="width:100px;">
      </td>
      <td style="padding:6px 8px;border-bottom:1px solid #eef2f7;">
        <textarea class="issue-input" rows="1" placeholder="Issue" required
                  style="width:100%;">${prefill.issue ?? ''}</textarea>
      </td>
      <td style="padding:6px 8px;border-bottom:1px solid #eef2f7; text-align:center;">
        <button type="button" class="remove-row-btn" title="Remove" aria-label="Remove"
                style="border:none;background:#fce8e8;padding:6px 10px;border-radius:6px;cursor:pointer;">
          ✕
        </button>
      </td>
    `;
    productsTbody.appendChild(tr);
  }

  function renumberRows() {
    const rows = productsTbody.querySelectorAll('tr.item-row');
    rows.forEach((row, idx) => {
      const cell = row.querySelector('.row-idx');
      if (cell) cell.textContent = idx + 1;
    });
  }

  addRowBtn.addEventListener('click', () => {
    addProductRow();
    renumberRows();
  });

  productsTbody.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-row-btn')) {
      const row = e.target.closest('tr.item-row');
      if (!row) return;
      const total = productsTbody.querySelectorAll('tr.item-row').length;
      // allow removing down to 0; we’ll re-add one on submit validation if needed
      row.remove();
      renumberRows();
    }
  });

  // ========= Submit =========
  claimRequestForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    claimLoadingSpinner.style.display = 'block';
    submitClaimButton.disabled = true;
    submitClaimButton.textContent = 'Submitting...';

    const dealerName = document.getElementById('claim-dealer-name').value.trim();
    const imageFiles = document.getElementById('image-attachments').files;
    const crmName = window.CRM_NAME;
    const requestDate = new Date().toISOString();

    // Collect all product rows
    const rows = [...productsTbody.querySelectorAll('tr.item-row')].map((row) => {
      const product = row.querySelector('.prod-input')?.value?.trim() ?? '';
      const details = row.querySelector('.details-input')?.value?.trim() ?? '';
      const qtyRaw = row.querySelector('.qty-input')?.value?.trim() ?? '';
      const issue = row.querySelector('.issue-input')?.value?.trim() ?? '';
      const qty = qtyRaw === '' ? NaN : parseInt(qtyRaw, 10);
      return { product, details, qty, issue };
    });

    // Basic validation
    const hasAtLeastOneRow = rows.length > 0;
    const invalidRow = rows.find(
      r => !r.product || !Number.isFinite(r.qty) || r.qty < 1 || !r.issue
    );

    if (!dealerName || !hasAtLeastOneRow || invalidRow) {
      showToast('Please fill Dealer, and valid Product/Qty/Issue in at least one row.', 'error');
      claimLoadingSpinner.style.display = 'none';
      submitClaimButton.disabled = false;
      submitClaimButton.textContent = 'Submit Claim';

      // If no rows, auto-add one to guide user
      if (!hasAtLeastOneRow) {
        addProductRow();
        renumberRows();
      }
      return;
    }

    // Convert images to Base64
    const imagePromises = Array.from(imageFiles).map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); // Base64 string
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
      });
    });

    try {
      const imagesBase64 = await Promise.all(imagePromises);

      // New payload: Items is an array of {product, details, qty, issue}
      const formData = {
        'Dealer Name': dealerName,
        'CRM Name': crmName,
        'Request Date': requestDate,
        'Items': rows.map(r => ({
          Product: r.product,
          Details: r.details,
          Qty: r.qty,
          Issue: r.issue
        })),
        'Images': imagesBase64
      };

      // Same endpoint you used earlier (no-cors retained)
      const googleAppsScriptUrl = 'https://script.google.com/macros/s/AKfycbw_fboaThUl8ReC8qOXTq6JNbYSJ_GciItm7JONC27F0_6O4oYGA_3F2GL1VFCvDeoO9A/exec';

      await fetch(googleAppsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      showToast('Claim request submitted!', 'success');
      closeClaimModal();

    } catch (error) {
      console.error('Error submitting claim request:', error);
      showToast('Failed to submit claim. Please try again.', 'error');
      claimLoadingSpinner.style.display = 'none';
      submitClaimButton.disabled = false;
      submitClaimButton.textContent = 'Submit Claim';
    }
  });

  // ========= Toast helper =========
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
});
