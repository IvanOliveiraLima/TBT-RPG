document.addEventListener('DOMContentLoaded', function() {
    var menuToggle = document.querySelector('#menu #menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            var menuButtons = document.querySelector('#menu #menu-buttons');
            if (menuButtons) {
                menuButtons.style.display = menuButtons.style.display === 'none' ? '' : 'none';
            }
            menuToggle.classList.toggle('change');
        });
    }
});
