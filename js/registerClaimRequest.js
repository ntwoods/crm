// GLOBAL variable defined in crm.html to manage auto-reload
// window.isModalOpen

document.addEventListener('DOMContentLoaded', () => {
    const registerClaimBtn = document.getElementById('register-claim-request-btn');
    const claimRequestModal = document.getElementById('claim-request-modal');
    const closeClaimBtn = document.getElementById('close-claim-modal-btn');
    const claimRequestForm = document.getElementById('claim-request-form');
    const submitClaimButton = document.getElementById('submit-claim-button');
    const claimLoadingSpinner = document.getElementById('claim-loading-spinner');

    // Show the modal and stop auto-reload
    registerClaimBtn.addEventListener('click', () => {
        claimRequestModal.style.display = 'block';
        window.isModalOpen = true;
    });

    // Close the modal and resume auto-reload
    const closeClaimModal = () => {
        claimRequestModal.style.display = 'none';
        claimRequestForm.reset();
        window.isModalOpen = false;
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

    // Handle form submission
    claimRequestForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        claimLoadingSpinner.style.display = 'block';
        submitClaimButton.disabled = true;
        submitClaimButton.textContent = 'Submitting...';

        const dealerName = document.getElementById('claim-dealer-name').value.trim();
        const product = document.getElementById('product').value.trim();
        const qty = parseInt(document.getElementById('qty').value.trim());
        const issue = document.getElementById('issue').value.trim();
        const imageFiles = document.getElementById('image-attachments').files;
        const crmName = window.CRM_NAME;
        const requestDate = new Date().toLocaleString();
        
        // Convert image files to Base64
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

            const formData = {
                'Dealer Name': dealerName,
                'Product': product,
                'Qty': qty,
                'Issue': issue,
                'CRM Name': crmName,
                'Request Date': requestDate,
                'Images': imagesBase64,
            };

            const googleAppsScriptUrl = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'; // Replace with your new script URL

            await fetch(googleAppsScriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            // Show a toast message for success
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

    // Helper function for toast messages (can be reused)
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
