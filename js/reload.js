    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") {
        location.reload();
      }
    });

    setInterval(() => {
      location.reload();
    }, 10000); // Reload every 10 seconds
