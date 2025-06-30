document.addEventListener('DOMContentLoaded', () => {
    const raisePurchaseRequestBtn = document.getElementById('raise-purchase-request-btn');
    const purchaseRequestModal = document.getElementById('purchase-request-modal');
    const closeButton = purchaseRequestModal.querySelector('.close-button');
    const purchaseRequestForm = document.getElementById('purchase-request-form');

    // Show the modal when the button is clicked
    raisePurchaseRequestBtn.addEventListener('click', () => {
        purchaseRequestModal.style.display = 'block';
    });

    // Hide the modal when the close button is clicked
    closeButton.addEventListener('click', () => {
        purchaseRequestModal.style.display = 'none';
        purchaseRequestForm.reset(); // Clear the form when closed
    });

    // Hide the modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === purchaseRequestModal) {
            purchaseRequestModal.style.display = 'none';
            purchaseRequestForm.reset(); // Clear the form when closed
        }
    });

    // Handle form submission
    purchaseRequestForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        const dealerName = document.getElementById('dealer-name').value;
        const productName = document.getElementById('product-name').value;
        const quantity = document.getElementById('quantity').value;
        const priorityLevel = document.getElementById('priority-level').value;
        const remarks = document.getElementById('remarks').value;
        const crmName = window.CRM_NAME; // Get CRM name from global variable
        const requestDate = new Date().toLocaleString(); // Get current timestamp

        const formData = {
            'Dealer Name': dealerName,
            'Product Name': productName,
            'Qty': quantity,
            'Priority Level': priorityLevel,
            'Remarks': remarks,
            'CRM Name': crmName,
            'Request Date': requestDate
        };

        // Replace with your Google Apps Script Web App URL
        const googleAppsScriptUrl = 'https://script.google.com/macros/s/AKfycbypgHg1iEHE6FQ-LJzaV3s4ETk1SKnAl1nulM6tBFUcQRuYOWb11sR9U2Bpw-9NcsEU/exec'; // IMPORTANT: You need to set this up

        try {
            const response = await fetch(googleAppsScriptUrl, {
                method: 'POST',
                mode: 'cors', // Crucial for cross-origin requests
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert('Purchase request submitted successfully!');
                purchaseRequestModal.style.display = 'none'; // Close modal on success
                purchaseRequestForm.reset(); // Clear form
            } else {
                alert('Error submitting purchase request: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while submitting the request. Please try again.');
        }
    });
});
