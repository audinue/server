export let serve = ({
  fetch,
  root = 'body',
  refresh = false,
  cache = false,
  storage = sessionStorage,
  before = () => {},
  after = () => {}
}) => {
  let container
  let navigating
  let caches = cache && JSON.parse(storage.getItem('cache') ?? '{}')
  let listeners = []

  let navigate = async (
    { method, url, body },
    replace = false,
    restored = false,
    previous = []
  ) => {
    let id = method + ' ' + url
    if (navigating === id) {
      return
    }
    if (cache && method === 'GET' && !restored) {
      let key = url
      while (key in caches) {
        let response = caches[key]
        if (!response) {
          break
        }
        if (response.location) {
          key = new URL(response.location, key)
          continue
        }
        container.innerHTML = response
        if (replace) {
          history.replaceState(response, '', key)
        } else {
          history.pushState(response, '', key)
        }
        scrollTo(0, 0)
        replace = true
        restored = true
        break
      }
    }
    if (!navigating) {
      container.classList.add('loading')
      before()
    }
    navigating = id
    let response = await fetch({ method, url, body })
    if (cache && method === 'GET') {
      caches[url] = response
      storage.setItem('cache', JSON.stringify(caches))
    }
    if (navigating !== id) {
      return
    }
    if (response.location) {
      navigate(
        {
          method: 'GET',
          url: new URL(response.location, url)
        },
        replace,
        restored,
        method === 'GET' ? [...previous, url] : previous
      )
      return
    }
    container.innerHTML = response
    if (previous.length) {
      if (!replace) {
        history.pushState(null, '', previous[0])
        replace = true
      }
      for (let url of previous.slice(1)) {
        history.replaceState(null, '', url)
      }
    }
    if (replace) {
      history.replaceState(response, '', url)
    } else {
      history.pushState(response, '', url)
    }
    if (!restored) {
      scrollTo(0, 0)
    }
    navigating = null
    container.classList.remove('loading')
    after()
  }

  let add = (type, listener) => {
    addEventListener(type, listener)
    listeners.push([type, listener])
  }

  let initialize = () => {
    container = document.querySelector(root)
    if (history.state) {
      container.innerHTML = history.state
    }
    navigate(
      {
        method: 'GET',
        url: new URL(location.href)
      },
      true,
      !!history.state
    )
  }

  if (document.readyState === 'loading') {
    add('DOMContentLoaded', initialize)
  } else {
    initialize()
  }

  add('popstate', event => {
    if (!event.state) {
      return
    }
    container.innerHTML = event.state
    if (refresh) {
      navigate(
        {
          method: 'GET',
          url: new URL(location.href)
        },
        true,
        true
      )
      return
    }
    if (!navigating) {
      return
    }
    navigating = null
    container.classList.remove('loading')
    after()
  })

  add('click', event => {
    if (event.target.nodeName !== 'A') {
      return
    }
    if (!event.target.hasAttribute('href')) {
      return
    }
    if (event.target.target !== '' && event.target.target !== '_self') {
      return
    }
    if (new URL(event.target.href).hostname !== location.hostname) {
      return
    }
    event.preventDefault()
    navigate(
      {
        method: 'GET',
        url: new URL(event.target.href)
      },
      event.target.hasAttribute('replace')
    )
  })

  add('submit', event => {
    if (event.target.method !== 'get' && event.target.method !== 'post') {
      return
    }
    if (event.target.target !== '' && event.target.target !== '_self') {
      return
    }
    if (new URL(event.target.action).hostname !== location.hostname) {
      return
    }
    event.preventDefault()
    if (event.target.method === 'post') {
      navigate(
        {
          method: 'POST',
          url: new URL(event.target.action),
          body: new FormData(event.target, event.submitter)
        },
        event.target.hasAttribute('replace')
      )
      return
    }
    navigate(
      {
        method: 'GET',
        url: [...new FormData(event.target, event.submitter)].reduce(
          (url, [key, value]) => {
            url.searchParams.set(key, value)
            return url
          },
          new URL(event.target.action)
        )
      },
      event.target.hasAttribute('replace')
    )
  })

  return {
    stop () {
      for (let [type, listener] of listeners) {
        removeEventListener(type, listener)
      }
    },
    push (url) {
      navigate({
        method: 'GET',
        url: new URL(url, location.href)
      })
    },
    replace (url) {
      navigate(
        {
          method: 'GET',
          url: new URL(url, location.href)
        },
        true
      )
    },
    reload () {
      navigate(
        {
          method: 'GET',
          url: new URL(location.href)
        },
        true
      )
    }
  }
}
