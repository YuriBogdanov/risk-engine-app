export default {
  title: 'Risk Engine — Обучение',
  description: 'Как не попасться на скам токены в DeFi',
  lang: 'ru-RU',
  themeConfig: {
    nav: [
      { text: 'Главная', link: '/' },
      { text: '← Назад в приложение', link: 'http://localhost:5173' },
    ],
    sidebar: [
      {
        text: 'Основы',
        items: [
          { text: 'Что такое скам токен?', link: '/basics/what-is-scam' },
          { text: 'Rug Pull', link: '/basics/rugpull' },
          { text: 'Honeypot', link: '/basics/honeypot' },
          { text: 'Как проверить токен', link: '/basics/how-to-check' },
        ],
      },
      {
        text: 'Продвинутый уровень',
        items: [
          { text: 'On-chain анализ', link: '/advanced/on-chain-analysis' },
          { text: 'Отслеживание китов', link: '/advanced/whale-tracking' },
        ],
      },
    ],
    socialLinks: [],
    footer: {
      message: 'Risk Engine — учебный проект по безопасности DeFi',
    },
  },
}
