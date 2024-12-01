fetch('menu.json')
  .then(response => response.json())
  .then(menuItems => {
    const menuContainer = document.getElementById('menu');
    menuItems.forEach(item => {
      const menuItem = document.createElement('div');
      menuItem.className = 'menu-item';
      menuItem.innerHTML = `
        <h3>${item.name} - ${item.price}</h3>
        <p>${item.description}</p>
      `;
      menuContainer.appendChild(menuItem);
    });
  })
  .catch(error => console.error('Error loading menu:', error));
