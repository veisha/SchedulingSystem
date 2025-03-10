function adjustButtonPosition() {
    const sidebar = document.querySelector('.sidebar');
    const header = document.querySelector('.header');
    const button = document.querySelector('button');

    if (sidebar && header && button) {
        const sidebarWidth = sidebar.offsetWidth; // Get the sidebar's width
        const headerHeight = header.offsetHeight; // Get the header's height

        // Check if the sidebar is hidden
        if (sidebar.classList.contains('hidden')) {
            button.style.left = '0'; // Move button to the left edge when sidebar is hidden
        } else {
            button.style.left = `${sidebarWidth-9}px`; // Align button with the sidebar's width when visible
        }

        // Set the button's top position to half of the header's height
        button.style.top = `${headerHeight / 2}px`;
    }
}

// Adjust the button position on page load
window.addEventListener('load', adjustButtonPosition);

// Adjust the button position when the window is resized
window.addEventListener('resize', adjustButtonPosition);

// Adjust the button position when the sidebar is toggled
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const container = document.querySelector('.container');

    sidebar.classList.toggle('hidden');
    container.classList.toggle('hidden-sidebar');

    // Re-adjust the button position after toggling the sidebar
    adjustButtonPosition();
}