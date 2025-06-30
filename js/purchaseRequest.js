// GLOBAL variable defined (ensure this is accessible)
// const googleAppsScriptUrl = 'https://script.google.com/macros/s/AKfycbypgHg1iEHE6FQ-LJzaV3s4ETk1SKnAl1nulM6tBFUcRRuYOWb11sR9U2Bpw-9NcsEU/exec';

document.addEventListener('DOMContentLoaded', () => {
    const raisePurchaseRequestBtn = document.getElementById('raise-purchase-request-btn');
    const purchaseRequestModal = document.getElementById('purchase-request-modal');
    const closeButton = purchaseRequestModal.querySelector('.close-button');
    const purchaseRequestForm = document.getElementById('purchase-request-form');
    const submitPrButton = document.getElementById('submit-pr-button'); // Get the submit button
    const prLoadingSpinner = document.getElementById('pr-loading-spinner'); // Get the spinner

// purchaseRequest.js
// ... (previous code) ...

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
            // Optional: If you want the toast to block clicks while visible,
            // you can temporarily add a class to toastContainer
            // toastContainer.classList.add('active');
        }, 10);

        // Hide and remove the toast after a duration
        setTimeout(() => {
            toast.classList.remove('show');
            // Optional: Remove the 'active' class from toastContainer
            // toastContainer.classList.remove('active');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    }

// ... (rest of the purchaseRequest.js code remains the same) ...
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

    // Handle form submission
    purchaseRequestForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        // Show loading spinner and disable button
        prLoadingSpinner.style.display = 'block';
        submitPrButton.disabled = true;
        submitPrButton.textContent = 'Submitting...';

        const dealerName = document.getElementById('dealer-name').value;
        const productName = document.getElementById('product-name').value;
        const quantity = document.getElementById('quantity').value;
        const priorityLevel = document.getElementById('priority-level').value;
        const remarks = document.getElementById('remarks').value;
        const crmName = window.CRM_NAME;
        const requestDate = new Date().toLocaleString();

        const formData = {
            'Dealer Name': dealerName,
            'Product Name': productName,
            'Qty': quantity,
            'Priority Level': priorityLevel,
            'Remarks': remarks,
            'CRM Name': crmName,
            'Request Date': requestDate
        };

        const googleAppsScriptUrl = 'https://script.google.com/macros/s/AKfycbypgHg1iEHE6FQ-LJzaV3s4ETk1SKnAl1nulM6tBFUcRRuYOWb11sR9U2Bpw-9NcsEU/exec';

        try {
            await fetch(googleAppsScriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            // If fetch completes without network error, show success notification
            showToast('Purchase request sent!', 'success'); // Change alert to toast
            closeModal(); // Close the modal

        } catch (error) {
            // This catches network errors (e.g., no internet, script URL typo)
            console.error('Error sending purchase request:', error);
            showToast('Failed to send request. Check connection.', 'error'); // Change alert to toast
            // Do not close modal on error, allow user to retry or inspect
            // Re-enable button and hide spinner on error
            prLoadingSpinner.style.display = 'none';
            submitPrButton.disabled = false;
            submitPrButton.textContent = 'Submit Request';
        }
    });
});
