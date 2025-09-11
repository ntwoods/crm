const workflowContainer = document.getElementById("workflow-container");
document.getElementById("crm-tagline").innerText =
  "Streamlined Order to Dispatch Workflow Management for " + CRM_NAME;

document.getElementById("additional-order-link").href =
  "https://ntwoods.github.io/ordertodispatch/addAdditionalOrder.html?crmName=" + ENCODED_CRM;
document.getElementById("purchase-request-link").href =
  "https://ntwoods.github.io/ordertodispatch/purchaseRequestStatus.html?crmName=" + ENCODED_CRM;
document.getElementById("completed-sales-orders-btn").href =
  "https://ntwoods.github.io/ordertodispatch/completedSalesOrdersCRM.html?crm=" + ENCODED_CRM;

const cardsData = [
  {
    id: "on-hold",
    level: "On Hold",
    title: "Orders on Hold",
    description: "View and manage all orders currently on hold.",
    url: "L7.html",
  },
  {
    id: "level34",
    level: "Level-1",
    title: "Check Credit & Stock Status",
    description:
      "Proceed even if there's insufficient stock or credit status is not Okay.",
    url: "L1.html",
  },
  {
    id: "level5",
    level: "Level-2",
    title: "Confirm with Accounts Team then Call Dealer",
    description:
      "Confirm with Accounts team based on party categories and then confirm the order.",
    url: "L2.html",
  },
  {
    id: "owner-approval",
    level: "Owner's Approval",
    title: "Owner's Approval Pending",
    description: "Pending orders awaiting owner's approval before proceeding.",
    url: "OwnerApprovalSOcrmView.html",
  },
  {
    id: "level6",
    level: "Level-3",
    title: "Get Tentative Dispatch Date",
    description: "Coordinate with Dispatch Department to Get Tentative Timeline",
    url: "L3.html",
  },
  {
    id: "level7",
    level: "Level-4",
    title: "Remind Dispatch Department",
    description: "Send Reminder 1 Day Before Dispatch",
    url: "L4.html",
  },
  {
    id: "level8",
    level: "Level-5",
    title: "Inform Dealer About Dispatch",
    description: "Final Communication - Inform Dealer About Complete Dispatch Details",
    url: "L5.html",
  },
  {
    id: "level9",
    level: "Level-6",
    title: "Goods Delivery Confirmation",
    description: "Confirmation of Goods Receiving from Dealer.",
    url: "L6.html",
  },
  {
    id: "level10",
    level: "Claim-Requests",
    title: "Dealer's Claim Request",
    description: "Inform Owner's & Move Forward",
    url: "informOwnersClaimReq.html",
  },  
];

cardsData.forEach((card) => {
  const div = document.createElement("div");
  div.className = "workflow-card";
  div.id = `${card.id}-card`;
  div.onclick = () =>
    navigateTo(
      `https://ntwoods.github.io/ordertodispatch/${card.url}?crm=${ENCODED_CRM}`
    );

  div.innerHTML = `
    <div class="card-level">${card.level}</div>
    <div class="card-icon"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg></div>
    <h3 class="card-title">${card.title}</h3>
    <p class="card-description">${card.description}</p>
    <div class="card-count" id="${card.id}-count">Loading...</div>
    <div class="card-arrow">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.025 1l-2.847 2.828 6.176 6.176H0v4h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/></svg>
    </div>
  `;

  workflowContainer.appendChild(div);
});
