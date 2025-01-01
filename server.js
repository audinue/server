export let serve = ({
  fetch,
  root = "body",
  reload = false,
  cache = null,
  navigating = () => {},
  navigated = () => {},
}) => {
  cache = {
    enabled: false,
    key: "cache",
    storage: sessionStorage,
    ...cache,
  };

  let container;
  let latest;
  let caches =
    cache.enabled && JSON.parse(cache.storage.getItem(cache.key) ?? "{}");
  let listeners = [];

  let navigate = async (
    { method, url, body },
    replace = false,
    restored = false,
    previous = []
  ) => {
    let id = method + " " + url;
    if (latest === id) {
      return;
    }
    if (cache.enabled && method === "GET" && !restored) {
      let key = url;
      while (key in caches) {
        let response = caches[key];
        if (!response) {
          break;
        }
        if (response.location) {
          key = new URL(response.location, key);
          continue;
        }
        container.innerHTML = response;
        if (replace) {
          history.replaceState(response, "", key);
        } else {
          history.pushState(response, "", key);
        }
        scrollTo(0, 0);
        replace = true;
        restored = true;
        break;
      }
    }
    if (!latest) {
      container.classList.add("navigating");
      navigating();
    }
    latest = id;
    let response = await fetch({ method, url, body });
    if (cache.enabled && method === "GET") {
      caches[url] = response;
      cache.storage.setItem(cache.key, JSON.stringify(caches));
    }
    if (latest !== id) {
      return;
    }
    if (response.location) {
      navigate(
        {
          method: "GET",
          url: new URL(response.location, url),
        },
        replace,
        restored,
        method === "GET" ? [...previous, url] : previous
      );
      return;
    }
    container.innerHTML = response;
    if (previous.length) {
      if (!replace) {
        history.pushState(null, "", previous.splice(1)[0]);
        replace = true;
      }
      for (let url of previous) {
        history.replaceState(null, "", url);
      }
    }
    if (replace) {
      history.replaceState(response, "", url);
    } else {
      history.pushState(response, "", url);
    }
    if (!restored) {
      scrollTo(0, 0);
    }
    latest = null;
    container.classList.remove("navigating");
    navigated();
  };

  let add = (type, listener) => {
    addEventListener(type, listener);
    listeners.push([type, listener]);
  };

  let initialize = () => {
    container = document.querySelector(root);
    if (history.state) {
      container.innerHTML = history.state;
    }
    navigate(
      {
        method: "GET",
        url: new URL(location.href),
      },
      true,
      !!history.state
    );
  };

  if (document.readyState === "loading") {
    add("DOMContentLoaded", initialize);
  } else {
    initialize();
  }

  add("popstate", (event) => {
    if (!event.state) {
      return;
    }
    container.innerHTML = event.state;
    if (reload) {
      navigate(
        {
          method: "GET",
          url: new URL(location.href),
        },
        true,
        true
      );
      return;
    }
    if (!latest) {
      return;
    }
    latest = null;
    container.classList.remove("loading");
    navigated();
  });

  add("click", (event) => {
    if (
      event.target.nodeName !== "A" ||
      !event.target.hasAttribute("href") ||
      (event.target.target !== "" && event.target.target !== "_self") ||
      new URL(event.target.href).hostname !== location.hostname
    ) {
      return;
    }
    event.preventDefault();
    navigate(
      {
        method: "GET",
        url: new URL(event.target.href),
      },
      event.target.hasAttribute("replace")
    );
  });

  add("submit", (event) => {
    if (
      (event.target.method !== "get" && event.target.method !== "post") ||
      (event.target.target !== "" && event.target.target !== "_self") ||
      new URL(event.target.action).hostname !== location.hostname
    ) {
      return;
    }
    event.preventDefault();
    if (event.target.method === "post") {
      navigate(
        {
          method: "POST",
          url: new URL(event.target.action),
          body: new FormData(event.target, event.submitter),
        },
        event.target.hasAttribute("replace")
      );
      return;
    }
    navigate(
      {
        method: "GET",
        url: [...new FormData(event.target, event.submitter)].reduce(
          (url, [key, value]) => {
            url.searchParams.set(key, value);
            return url;
          },
          new URL(event.target.action)
        ),
      },
      event.target.hasAttribute("replace")
    );
  });

  return {
    dispose() {
      for (let [type, listener] of listeners) {
        removeEventListener(type, listener);
      }
    },
    push(url) {
      navigate({
        method: "GET",
        url: new URL(url, location.href),
      });
    },
    replace(url) {
      navigate(
        {
          method: "GET",
          url: new URL(url, location.href),
        },
        true
      );
    },
    reload() {
      navigate(
        {
          method: "GET",
          url: new URL(location.href),
        },
        true
      );
    },
    async fetch(url, { method = "GET", body } = {}) {
      let next = new URL(url, location.href);
      while (true) {
        let response = await fetch({
          method,
          url: next,
          body,
        });
        if (response.location) {
          next = new URL(response.location, next);
          continue;
        }
        return response;
      }
    },
  };
};

export const redirect = (location) => ({ location });
