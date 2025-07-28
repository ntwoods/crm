// GLOBAL variable defined (ensure this is accessible)
document.addEventListener('DOMContentLoaded', () => {
    const raisePurchaseRequestBtn = document.getElementById('raise-purchase-request-btn');
    const purchaseRequestModal = document.getElementById('purchase-request-modal');
    const closeButton = purchaseRequestModal.querySelector('.close-button');
    const purchaseRequestForm = document.getElementById('purchase-request-form');
    const submitPrButton = document.getElementById('submit-pr-button'); // Get the submit button
    const prLoadingSpinner = document.getElementById('pr-loading-spinner'); // Get the spinner
    const requiredItemsFile = document.getElementById('required-items-file'); // Get the new file input
    fetchItemListFromSheet(); // Load item dropdown from IMS sheet
    
async function fetchItemListFromSheet() {
  const sheetId = '1UeohB4IPgEzGwybOJaIKpCIa38A4UvBstM8waqYv9V0';
  const sheetName = 'IMS';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!C3:C?key=YOUR_API_KEY`; // Replace with your actual API key

  try {
    const response = await fetch(url);
    const data = await response.json();
    const items = data.values.flat();

    const selector = document.getElementById('item-selector');
    selector.innerHTML = ""; // Clear existing
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item;
      opt.textContent = item;
      selector.appendChild(opt);
    });

  } catch (error) {
    console.error('Failed to fetch item list:', error);
    showToast('Failed to load item list.', 'error');
  }
}
    
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

    // Show the modal when the button is clicked
    raisePurchaseRequestBtn.addEventListener('click', () => {
        purchaseRequestModal.style.display = 'block';
        if (typeof isModalOpen !== 'undefined') { // Ensure the global flag exists
            isModalOpen = true; // Set flag to true when modal is open
        }
    });

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
    };

    // Hide the modal when the close button is clicked
    closeButton.addEventListener('click', closeModal);

    // Hide the modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === purchaseRequestModal) {
            closeModal();
        }
    });

    // Function to convert file to Base64
    const getBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    // Handle form submission
    purchaseRequestForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        // Show loading spinner and disable button
        prLoadingSpinner.style.display = 'block';
        submitPrButton.disabled = true;
        submitPrButton.textContent = 'Submitting...';

        const dealerName = document.getElementById('dealer-name').value;
        const priorityLevel = document.getElementById('priority-level').value;
        const remarks = document.getElementById('remarks').value;
        const crmName = window.CRM_NAME;
        const requestDate = new Date().toLocaleString();

        let fileDataBase64 = null;
        if (requiredItemsFile.files.length > 0) {
            try {
                fileDataBase64 = await getBase64(requiredItemsFile.files[0]);
            } catch (error) {
                console.error('Error converting file to Base64:', error);
                showToast('Failed to read file. Please try again.', 'error');
                prLoadingSpinner.style.display = 'none';
                submitPrButton.disabled = false;
                submitPrButton.textContent = 'Submit Request';
                return; // Stop submission if file conversion fails
            }
        } else {
            showToast('Please attach the required items file.', 'error');
            prLoadingSpinner.style.display = 'none';
            submitPrButton.disabled = false;
            submitPrButton.textContent = 'Submit Request';
            return; // Stop submission if no file is attached
        }

        const formData = {
            'Dealer Name': dealerName,
            'Priority Level': priorityLevel,
            'Remarks': remarks,
            'CRM Name': crmName,
            'Request Date': requestDate,
            'Required Items File Data': fileDataBase64, // Include Base64 file data
            'Required Items File Name': requiredItemsFile.files[0].name // Include file name
        };

        const googleAppsScriptUrl = 'https://script.google.com/macros/s/AKfycbyffY1_V3ap0VOnFJ8tIPP5bR9_gy_cVQ8_WmLpu0Q6E_dzHOUDPbdXnP4Db5gXRyxl/exec';

        try {
            await fetch(googleAppsScriptUrl, {
                method: 'POST',
                mode: 'no-cors', // Use 'no-cors' for Google Apps Script to avoid CORS issues on client-side
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            // If fetch completes without network error, show success notification
            showToast('Purchase request sent!', 'success');
            closeModal(); // Close the modal

        } catch (error) {
            // This catches network errors (e.g., no internet, script URL typo)
            console.error('Error sending purchase request:', error);
            showToast('Failed to send request. Check connection.', 'error');
            // Do not close modal on error, allow user to retry or inspect
            // Re-enable button and hide spinner on error
            prLoadingSpinner.style.display = 'none';
            submitPrButton.disabled = false;
            submitPrButton.textContent = 'Submit Request';
        }
    });
});
