        function navigateTo(url) {
            const clickedCard = event.currentTarget;
            clickedCard.style.transform = 'scale(0.98)'; // Smaller click scale
            
            setTimeout(() => {
                window.open(url, '_blank');
                clickedCard.style.transform = '';
            }, 100); // Faster redirect
        }
