// dashboard.js — Tab navigation logic for the dashboard view

document.addEventListener('DOMContentLoaded', function () {
    var goToEditBtn = document.getElementById('goToEditTabBtn');
    if (goToEditBtn) {
        goToEditBtn.addEventListener('click', function () {
            var editTab = document.getElementById('editar-tab');
            var tab = new bootstrap.Tab(editTab);
            tab.show();
        });
    }
});
