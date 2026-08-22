document.addEventListener('DOMContentLoaded', () => {

  const items = document.querySelectorAll('.item');

  items.forEach(item => {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');

    const activate = () => {
      items.forEach(other => {
        if (other !== item) other.classList.remove('is-tapped');
      });
      item.classList.toggle('is-tapped');
    };

    item.addEventListener('click', activate);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.item')) {
      items.forEach(i => i.classList.remove('is-tapped'));
    }
  });

});
