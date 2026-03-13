export function renderMenu(id) {
    const curr = document.querySelector(".menu.show");
    if (curr) curr.classList.remove('show');

    const newMenu = document.getElementById(id);
    newMenu.classList.add('show');
};