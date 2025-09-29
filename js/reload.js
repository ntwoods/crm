document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible" && !isModalOpen) { // Check the flag
    location.reload();
  }
});

setInterval(() => {
  if (!isModalOpen) { // Check the flag before reloading
    location.reload();
  }
}, 2 * 60 * 1000); // Reload every 10 seconds
