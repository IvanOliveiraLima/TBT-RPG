import { useRegisterSW } from 'virtual:pwa-register/react'
import { useTranslation } from '@/i18n'
import { DismissibleBanner } from './DismissibleBanner'

export function PwaUpdatePrompt() {
  const { t } = useTranslation()

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      if (!r) return
      // Periodic check every hour — sessions stay open for hours during a game
      setInterval(() => { void r.update() }, 60 * 60 * 1000)
      // Also check when the tab regains focus
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void r.update()
      })
    },
  })

  if (!needRefresh && !offlineReady) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(400px, calc(100vw - 32px))',
        zIndex: 9999,
      }}
    >
      {needRefresh ? (
        <DismissibleBanner
          tone="success"
          title={t('pwa.update_available')}
          message=""
          actionLabel={t('pwa.reload')}
          onAction={() => { void updateServiceWorker(true) }}
          onDismiss={() => setNeedRefresh(false)}
          autoDismissMs={0}
        />
      ) : (
        <DismissibleBanner
          tone="success"
          title={t('pwa.offline_ready')}
          message=""
          onDismiss={() => setOfflineReady(false)}
          autoDismissMs={5000}
        />
      )}
    </div>
  )
}
