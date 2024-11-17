document.addEventListener('DOMContentLoaded', () => {
  const searchButtons = document.querySelectorAll('.searchBtn');
  const searchBar = document.querySelector('.searchBar');
  const searchInput = document.getElementById('searchInput');
  const searchClose = document.getElementById('searchClose');
  const carousel = document.querySelector('.carousel');
  const prevButton = document.querySelector('.carousel-button.prev');
  const nextButton = document.querySelector('.carousel-button.next');

  // Carousel controls
  const scrollAmount = 200;

  prevButton?.addEventListener('click', () => {
      carousel.scrollLeft -= scrollAmount;
  });

  nextButton?.addEventListener('click', () => {
      carousel.scrollLeft += scrollAmount;
  });

  // Search bar functionality
  searchButtons.forEach(button => {
      button.addEventListener('click', () => {
          searchBar.classList.add('open');
          searchBar.style.visibility = 'visible';
          button.setAttribute('aria-expanded', 'true');
          searchInput.focus();
      });
  });

  searchClose.addEventListener('click', () => {
      searchBar.classList.remove('open');
      searchBar.style.visibility = 'hidden';
      searchClose.setAttribute('aria-expanded', 'false');
  });
});
