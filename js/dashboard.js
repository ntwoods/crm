async function fetchAndUpdateCount(levelKey, elementId, cardId) {
  try {
    const response = await fetch(apiEndpoints[levelKey]);
    const data = await response.json();

    // Accept { data:[...] }, [...], or { results:[...] }
    const rows = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
      ? data
      : Array.isArray(data?.results)
      ? data.results
      : [];

    const count = rows.length;

    const countElement = document.getElementById(elementId);
    const cardElement = document.getElementById(cardId);

    cardElement.classList.remove('pending-highlight-red', 'all-clear-highlight-green', 'pulse-animation');

    if (count > 0) {
      countElement.innerHTML = `Pending: ${count}`;
      cardElement.classList.add('pending-highlight-red', 'pulse-animation');
    } else {
      countElement.innerHTML = `All Clear`;
      cardElement.classList.add('all-clear-highlight-green');
    }
  } catch (error) {
    console.error(`Error fetching ${levelKey}:`, error);
    document.getElementById(elementId).innerText = `Error`;
    document.getElementById(cardId).classList.add('pending-highlight-red', 'pulse-animation');
  }
}


        // Initialize counts for all levels
        fetchAndUpdateCount('onHold', 'on-hold-count', 'on-hold-card');
        fetchAndUpdateCount('level34', 'level34-count', 'level34-card');
        fetchAndUpdateCount('level5', 'level5-count', 'level5-card');
        fetchAndUpdateCount('ownerApproval', 'owner-approval-count', 'owner-approval-card');
        fetchAndUpdateCount('level6', 'level6-count', 'level6-card');
        fetchAndUpdateCount('level7', 'level7-count', 'level7-card');
        fetchAndUpdateCount('level8', 'level8-count', 'level8-card');
        fetchAndUpdateCount('level9', 'level9-count', 'level9-card');        
