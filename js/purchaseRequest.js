// GLOBAL variable defined (ensure this is accessible in purchaseRequest.js, e.g., in crm.html script tag or another shared file)
// const googleAppsScriptUrl = 'https://script.google.com/macros/s/AKfycbypgHg1iEHE6FQ-LJzaV3s4ETk1SKnAl1nulM6tBFUcQRuYOWb11sR9U2Bpw-9NcsEU/exec';

// purchaseRequest.js
document.addEventListener('DOMContentLoaded', () => {
    const raisePurchaseRequestBtn = document.getElementById('raise-purchase-request-btn');
    const purchaseRequestModal = document.getElementById('purchase-request-modal');
    const closeButton = purchaseRequestModal.querySelector('.close-button');
    const purchaseRequestForm = document.getElementById('purchase-request-form');

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

        // Make sure googleAppsScriptUrl is defined and accessible here.
        // If it's a global variable, it needs to be declared globally or passed in.
        // For this example, assuming it's globally available.
        const googleAppsScriptUrl = 'https://script.google.com/macros/s/AKfycbypgHg1iEHE6FQ-LJzaV3s4ETk1SKnAl1nulM6tBFUcQRuYOWb11sR9U2Bpw-9NcsEU/exec';

        try {
            // With 'no-cors' mode, the browser cannot read the response body or status.
            // The fetch call will likely succeed in sending the request, but the
            // JavaScript code won't know if the Google Apps Script actually processed it successfully.
            // Therefore, we assume success after the fetch call completes without a network error.
            await fetch(googleAppsScriptUrl, {
                method: 'POST',
                mode: 'no-cors', // Keeping no-cors as per your requirement
                headers: {
                    // In 'no-cors' mode, setting 'Content-Type': 'application/json' might not
                    // have the desired effect for a preflight request if the server doesn't
                    // explicitly handle it without CORS headers.
                    // For Google Apps Script, a simple text/plain or application/x-www-form-urlencoded
                    // might be more compatible with 'no-cors' if you intend to send form data.
                    // However, for JSON, you might face issues in actually parsing it on the server
                    // if the browser doesn't send the proper Content-Type header.
                    // For the purpose of 'no-cors' and simple data transmission,
                    // you might reconsider the data format on the Apps Script side
                    // or accept that the Content-Type header might not be fully honored.
                    // For now, keeping it as requested.
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            // If the fetch call completes without a network error, we assume it was sent.
            // Since we can't check the server's response in 'no-cors' mode,
            // we give immediate feedback to the user.
            alert('Purchase request submitted (likely successfully)!');
            closeModal(); // Close the modal immediately after sending the request

        } catch (error) {
            // This catch block will only execute for network errors (e.g., no internet connection, DNS failure).
            console.error('Error sending purchase request:', error);
            alert('An error occurred while sending the request. Please check your internet connection and try again.');
        }
    });
});
