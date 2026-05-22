(function () {
  const routes = document.querySelectorAll("[data-route]");
  const links = document.querySelectorAll("[data-route-link]");

  function showRoute(name) {
    const fallback = routes[0] && routes[0].getAttribute("data-route");
    const routeName = name || fallback;
    routes.forEach((route) => {
      route.classList.toggle("active", route.getAttribute("data-route") === routeName);
    });
    links.forEach((link) => {
      const isActive = link.getAttribute("data-route-link") === routeName;
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function routeFromHash() {
    return window.location.hash.replace("#", "") || "home";
  }

  window.addEventListener("hashchange", () => showRoute(routeFromHash()));
  showRoute(routeFromHash());
})();
