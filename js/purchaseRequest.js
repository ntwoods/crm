// GLOBAL variable defined
const googleAppsScriptUrl = 'https://script.google.com/macros/s/AKfycbypgHg1iEHE6FQ-LJzaV3s4ETk1SKnAl1nulM6tBFUcQRuYOWb11sR9U2Bpw-9NcsEU/exec';

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
        try {
            const response = await fetch(googleAppsScriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
                alert('Purchase request submitted successfully!');
                closeModal(); // Use the common close function
            } 
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while submitting the request. Please try again.');
        }
    });
});
