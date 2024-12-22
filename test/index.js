import { serve } from '../server'

let links = `
  <p>
    <a href="/">Home</a>
    <a href="/tab-a">Link Replace Test</a>
    <a href="/form-get">Form Get Test</a>
    <a href="/form-post">Form Post Test</a>
    <a href="/posts">Posts</a>
    <a href="/redirection">Redirection Test</a>
  </p>
`

let tabs = `
  <p>
    <a href="/tab-a" replace>Tab A</a>
    <a href="/tab-b" replace>Tab B</a>
    <a href="/tab-c" replace>Tab C</a>
  </p>
`

serve({
  root: '#root',
  cache: true,
  loaded () {
    document
      .querySelectorAll('#root h1')
      .forEach(h1 => (document.title = h1.textContent))
  },
  async fetch (req) {
    switch (req.url.pathname) {
      case '/':
        return `
          ${links}
          <h1>Home</h1>
        `
      case '/tab-a':
        return `
          ${links}
          ${tabs}
          <h1>Tab A</h1>
        `
      case '/tab-b':
        return `
          ${links}
          ${tabs}
          <h1>Tab B</h1>
        `
      case '/tab-c':
        return `
          ${links}
          ${tabs}
          <h1>Tab C</h1>
        `
      case '/form-get':
        return `
          ${links}
          <h1>Form Get Test</h1>
          <p>Query: ${req.url.searchParams.get('q')}</p>
          <form>
            <input name="q">
          </form>
        `
      case '/form-post':
        if (req.method === 'POST') {
          return {
            location: '/form-get?q=' + encodeURIComponent(req.body.get('q'))
          }
        }
        return `
          ${links}
          <h1>Form Post Test</h1>
          <form method="post">
            <input name="q">
          </form>
        `
      case '/posts':
        let posts = await (
          await fetch('https://jsonplaceholder.typicode.com/posts')
        ).json()
        return `
          ${links}
          <h1>Posts</h1>
          <ul>
            ${posts
              .map(
                post => `
                  <li>
                    <a href="/post?id=${post.id}">${post.title}</a>
                  </li>
                `
              )
              .join('')}
          </ul>
        `
      case '/post':
        let [post, comments] = await Promise.all([
          fetch(
            `https://jsonplaceholder.typicode.com/posts/${req.url.searchParams.get(
              'id'
            )}`
          ).then(res => res.json()),
          fetch(
            `https://jsonplaceholder.typicode.com/comments/?postId=${req.url.searchParams.get(
              'id'
            )}`
          ).then(res => res.json())
        ])
        return `
          ${links}
          <h1>${post.title}</h1>
          <p>${post.body}</p>
          <ul>
            ${comments
              .map(
                comment => `
                  <li>${comment.body}</li>
                `
              )
              .join('')}
          </ul>
        `
      case '/redirection':
        return `
          ${links}
          <h1>Redirection Test</h1>
          <p>
            <a href="/foo">Foo</a>
            <a href="/bar">Bar</a>
            <a href="/baz">Baz</a>
            <a href="/qux">Qux</a>
          </p>
        `
      case '/foo':
        return { location: '/bar' }
      case '/bar':
        return { location: '/baz' }
      case '/baz':
        return { location: '/qux' }
      case '/qux':
        return `
          ${links}
          <h1>Qux</h1>
        `
      default:
        return `
          ${links}
          <h1>Not Found</h1>
        `
    }
  }
})
