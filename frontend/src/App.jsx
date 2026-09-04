import { useEffect, useMemo, useRef, useState } from 'react'
import Logo from './components/ui/Logo'
import { COUNTRIES } from './data/countries'
import { CONTINENTS, CONTINENT_EMOJI, flagEmoji } from './data/staticMeta'
import {
  ACHIEVEMENTS,
  addXP,
  checkAchievements,
  continentMastery,
  countriesLearned,
  countriesOf,
  createDemoState,
  masteryOf,
  masteredCount,
  overallMastery,
  recordAnswer,
  reviewDue,
  statusOf,
  touchStreak,
  weakCountries,
} from './lib/mastery'
import { login, logout, signup, forgotPassword, changePassword } from './api/auth'
import { pingBackend } from './api/client'
import { getCountries } from './api/countries'
import { getProfile, updateProfile, deleteProfile } from './api/profile'
import { getProgress, submitAnswer } from './api/progress'
import { createQuizAttempt } from './api/quizzes'

const VIEW_LABELS = {
  dashboard: 'Dashboard',
  learn: 'Learn',
  continent: 'Continent',
  country: 'Country',
  practice: 'Practice',
  weekly: 'Weekly Tests',
  progress: 'Progress',
  profile: 'Profile',
  settings: 'Settings',
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function dayName(date) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
}

function shuffle(items) {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function capitalizeFact(country) {
  return `${country.capital} is the capital of ${country.name}, located in ${country.region}, ${country.continent}.`
}

function googleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.81 2.73v2.27h2.92c1.71-1.57 2.69-3.89 2.69-6.64z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.27c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33C2.44 15.98 5.48 18 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.7c-.18-.54-.28-1.11-.28-1.7s.1-1.16.28-1.7V4.97H.96A8.996 8.996 0 000 9c0 1.45.35 2.83.96 4.03l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.97l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}

function emptyState(icon, title, sub, buttonLabel, onClick) {
  return (
    <div className="empty">
      <div className="ic">{icon}</div>
      <h3>{title}</h3>
      <p>{sub}</p>
      {buttonLabel ? (
        <button type="button" className="btn btn-primary" onClick={onClick}>
          {buttonLabel}
        </button>
      ) : null}
    </div>
  )
}

function logoMark() {
  return <Logo size={30} />
}

function passwordEyeIcon(visible) {
  return visible ? '🙈' : '👁️'
}

function avatarNode(profile, initials, size) {
  const src = profile?.avatarUrl || profile?.avatar_url || ''
  if (src) {
    return <img src={src} alt="" aria-hidden="true" draggable="false" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  }
  return <div className="avatar" style={{ width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.34)) }}>{initials}</div>
}

function useBlueApp() {
  const [screen, setScreen] = useState('loading')
  const [view, setView] = useState('dashboard')
  const [authError, setAuthError] = useState('')
  const [signupError, setSignupError] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [toast, setToast] = useState('')
  const [data, setData] = useState(createDemoState())
  const [countries, setCountries] = useState(COUNTRIES)
  const [currentEmail, setCurrentEmail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [onboardStep, setOnboardStep] = useState(1)
  const [obContinents, setObContinents] = useState([])
  const [obGoal, setObGoal] = useState('')
  const [learnContinent, setLearnContinent] = useState(null)
  const [countryDetail, setCountryDetail] = useState(null)
  const [session, setSession] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [results, setResults] = useState(null)
  const [browserReminderEnabled, setBrowserReminderEnabled] = useState(() => localStorage.getItem('blueapp:browser-reminders') === 'true')
  const [activeContinent, setActiveContinent] = useState(() => localStorage.getItem('blueapp:active-continent') || '')
  const [weeklyPrompt, setWeeklyPrompt] = useState(null)
  const [deletePromptOpen, setDeletePromptOpen] = useState(false)
  const [settingsDraft, setSettingsDraft] = useState(null)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState('')
  const [settingsSuccess, setSettingsSuccess] = useState('')
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const timerRef = useRef(null)

  const persistClientSide = (nextData = data) => {
    if (currentEmail) {
      localStorage.setItem(`blueapp:data:${currentEmail}`, JSON.stringify(nextData))
    }
  }

  const loadProfile = async () => {
    const [profilePayload, countriesPayload, progressPayload] = await Promise.allSettled([
      getProfile(),
      getCountries(),
      getProgress(),
    ])

    const profile = profilePayload.status === 'fulfilled' ? profilePayload.value : null
    const countriesData = countriesPayload.status === 'fulfilled' ? countriesPayload.value : { countries: COUNTRIES }
    const progressData =
      progressPayload.status === 'fulfilled'
        ? progressPayload.value
        : { progress: {}, quizAttempts: [], activity: {} }

    const unauthorized = [profilePayload, countriesPayload, progressPayload].some(
      (result) => result.status === 'rejected' && result.reason?.status === 401,
    )
    if (unauthorized) throw new Error('Session expired')

    setData({
      profile: profile?.profile || createDemoState().profile,
      progress: progressData.progress || {},
      quizAttempts: progressData.quizAttempts || [],
      achievements: profile?.achievements || [],
      activity: progressData.activity || {},
    })
    setCountries(countriesData.countries || COUNTRIES)
    setCurrentEmail(profile?.profile?.email || profile?.email || null)
    if (profile?.profile?.selectedContinents?.length && !localStorage.getItem('blueapp:active-continent')) {
      const firstContinent = profile.profile.selectedContinents[0]
      setActiveContinent(firstContinent)
      localStorage.setItem('blueapp:active-continent', firstContinent)
    }
    setScreen(profile?.profile?.onboarded ? 'app' : 'onboarding')
    setLoading(false)
  }

  useEffect(() => {
    let mounted = true
    async function boot() {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const accessToken = hash.get('access_token')
      if (accessToken) {
        localStorage.setItem('blueapp:token', accessToken)
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
      }

      const token = localStorage.getItem('blueapp:token')
      if (!token) {
        if (mounted) {
          setScreen('login')
          setLoading(false)
        }
        return
      }
      try {
        await loadProfile()
      } catch {
        // Never restore the old demo account when a Supabase session is invalid.
        localStorage.removeItem('blueapp:demo')
        localStorage.removeItem('blueapp:token')
        setCurrentEmail(null)
        setScreen('login')
        setLoading(false)
      }
    }
    boot()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const handleSessionExpired = () => {
      localStorage.removeItem('blueapp:token')
      setCurrentEmail(null)
      setSession(null)
      setQuiz(null)
      setResults(null)
      setView('dashboard')
      setAuthError('Your session expired. Please log in again.')
      setScreen('login')
    }

    window.addEventListener('blueapp:session-expired', handleSessionExpired)
    return () => window.removeEventListener('blueapp:session-expired', handleSessionExpired)
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const handle = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(handle)
  }, [toast])

  useEffect(() => {
    if (screen === 'app' && view === 'settings' && data.profile) {
      setSettingsDraft({
        fullName: data.profile.fullName || '',
        learningGoal: data.profile.learningGoal || '',
        avatarUrl: data.profile.avatarUrl || '',
      })
      setSettingsMessage('')
    }
  }, [screen, view, data.profile?.fullName, data.profile?.learningGoal, data.profile?.avatarUrl])

  useEffect(() => {
    notifyBrowserReminder()
    const interval = setInterval(notifyBrowserReminder, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [browserReminderEnabled, data.profile?.notifPrefs?.weeklyReminder, data.quizAttempts, data.profile?.selectedContinents?.join('|'), activeContinent, learnContinent])

  useEffect(() => {
    if (!quiz || quiz.kind !== 'weekly') return undefined
    timerRef.current = setInterval(() => {
      setQuiz((current) => {
        if (!current || current.kind !== 'weekly') return current
        const next = { ...current, timeLeft: current.timeLeft - 1 }
        if (next.timeLeft <= 0) {
          clearInterval(timerRef.current)
          finishQuiz(next)
          return next
        }
        return next
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [quiz?.kind])

  const saveAndSync = async (nextData) => {
    setData(nextData)
    persistClientSide(nextData)
    try {
      await updateProfile({ profile: nextData.profile, achievements: nextData.achievements })
    } catch {
      // local fallback is intentionally supported for offline development
    }
  }

  const latestWeeklyAttempt = (attempts = data.quizAttempts) =>
    attempts
      .filter((attempt) => attempt.continent)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0] || null

  const weeklyReminderState = () => {
    if (!data.profile?.notifPrefs?.weeklyReminder) return false
    const latest = latestWeeklyAttempt()
    const continent = activeContinent || learnContinent || latest?.continent || data.profile.selectedContinents?.[0] || 'Africa'
    if (!latest) return null
    const daysSince = Math.floor((Date.now() - new Date(latest.completedAt).getTime()) / 86400000)
    if (daysSince < 6) return null
    return {
      continent,
      phase: daysSince >= 7 ? 'today' : 'tomorrow',
    }
  }

  const notifyBrowserReminder = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (!browserReminderEnabled || Notification.permission !== 'granted') return
    const reminder = weeklyReminderState()
    if (!reminder) return

    const today = todayStr()
    const lastNotified = localStorage.getItem(`blueapp:last-browser-reminder:${reminder.phase}`)
    if (lastNotified === today) return

    const title = reminder.phase === 'today' ? 'BlueApp weekly test is ready today' : 'BlueApp weekly test is due tomorrow'
    const body =
      reminder.phase === 'today'
        ? `Open BlueApp to take your ${reminder.continent} test now and keep your streak going.`
        : `Your ${reminder.continent} weekly test will be ready tomorrow.`

    new Notification(title, {
      body,
    })
    localStorage.setItem(`blueapp:last-browser-reminder:${reminder.phase}`, today)
  }

  const toggleBrowserReminders = async () => {
    if (browserReminderEnabled) {
      setBrowserReminderEnabled(false)
      localStorage.setItem('blueapp:browser-reminders', 'false')
      showToast('Browser reminders turned off.')
      return
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('Your browser does not support notifications.')
      return
    }
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setBrowserReminderEnabled(true)
      localStorage.setItem('blueapp:browser-reminders', 'true')
      showToast('Browser reminders enabled.')
      notifyBrowserReminder()
    } else {
      showToast('Browser reminders were not enabled.')
    }
  }

  const dismissWeeklyPrompt = () => {
    if (!weeklyPrompt) return
    if (weeklyPrompt.preview) {
      setWeeklyPrompt(null)
      return
    }
    localStorage.setItem(`blueapp:weekly-prompt-dismissed:${weeklyPrompt.phase}`, todayStr())
    setWeeklyPrompt(null)
  }

  const takeWeeklyTestNow = () => {
    if (!weeklyPrompt) return
    if (!weeklyPrompt.preview) {
      localStorage.setItem(`blueapp:weekly-prompt-dismissed:${weeklyPrompt.phase}`, todayStr())
    }
    setWeeklyPrompt(null)
    startWeeklyTest(weeklyPrompt.continent)
  }

  const openWeeklyPreview = (phase) => {
    setWeeklyPrompt({
      continent: activeContinent || learnContinent || data.profile.selectedContinents?.[0] || 'Africa',
      phase,
      preview: true,
    })
  }

  const doLogin = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim().toLowerCase()
    const password = String(form.get('password') || '')
    setAuthError('')
    try {
      const payload = await login({ email, password })
      localStorage.setItem('blueapp:token', payload.token)
      setCurrentEmail(email)
      await loadProfile()
    } catch (error) {
      localStorage.removeItem('blueapp:token')
      setAuthError(error.message || 'Invalid email or password.')
    }
  }

  const doSignup = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const fullName = String(form.get('fullName') || '').trim()
    const email = String(form.get('email') || '').trim().toLowerCase()
    const password = String(form.get('password') || '')
    const confirmPassword = String(form.get('confirmPassword') || '')
    if (password !== confirmPassword) {
      setSignupError('Passwords do not match.')
      return
    }
    setSignupError('')
    try {
      const payload = await signup({ fullName, email, password })
      localStorage.setItem('blueapp:token', payload.token)
      setCurrentEmail(email)
      await loadProfile()
    } catch (error) {
      setSignupError(error.message || 'Could not create account.')
    }
  }

  const doForgot = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim().toLowerCase()
    try {
      await forgotPassword({ email })
    } finally {
      setForgotSent(true)
    }
  }

  const doLogout = async () => {
    try {
      await logout()
    } catch {
      // offline fallback
    }
    localStorage.removeItem('blueapp:token')
    setScreen('login')
    setView('dashboard')
  }

  const updateSettingsDraft = (patch) => {
    setSettingsSuccess('')
    setSettingsMessage('')
    setSettingsDraft((current) => ({ ...(current || { fullName: '', learningGoal: '', avatarUrl: '' }), ...patch }))
  }

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setSettingsMessage('Please choose an image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setSettingsMessage('Please choose an image smaller than 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setSettingsMessage('')
      updateSettingsDraft({ avatarUrl: String(reader.result || '') })
    }
    reader.readAsDataURL(file)
  }

  const saveProfileSettings = async (event) => {
    event.preventDefault()
    if (!settingsDraft) return

    const nextProfile = {
      ...data.profile,
      fullName: settingsDraft.fullName.trim() || data.profile.fullName,
      learningGoal: settingsDraft.learningGoal || data.profile.learningGoal,
      avatarUrl: settingsDraft.avatarUrl || '',
    }

    const nextData = {
      ...data,
      profile: nextProfile,
    }

    setSettingsSaving(true)
    setSettingsMessage('')
    setSettingsSuccess('')
    try {
      await saveAndSync(nextData)
      setSettingsDraft({
        fullName: nextProfile.fullName || '',
        learningGoal: nextProfile.learningGoal || '',
        avatarUrl: nextProfile.avatarUrl || '',
      })
      setSettingsSuccess('Profile updated successfully.')
      showToast('Profile updated.')
    } catch {
      setSettingsMessage('Unable to save your changes right now.')
    } finally {
      setSettingsSaving(false)
    }
  }

  const openPasswordModal = () => {
    setPasswordError('')
    setPasswordSuccess('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setPasswordModalOpen(true)
  }

  const closePasswordModal = () => {
    setPasswordModalOpen(false)
    setPasswordError('')
    setPasswordSuccess('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  const submitPasswordChange = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const currentPassword = String(form.get('currentPassword') || '')
    const newPassword = String(form.get('newPassword') || '')
    const confirmPassword = String(form.get('confirmPassword') || '')

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    setPasswordSaving(true)
    setPasswordError('')
    setPasswordSuccess('')
    try {
      await changePassword({ currentPassword, newPassword })
      setPasswordSuccess('Password updated successfully.')
      showToast('Password updated.')
      event.currentTarget.reset()
      setTimeout(() => {
        closePasswordModal()
      }, 650)
    } catch (error) {
      setPasswordError(error.message || 'Unable to update password.')
    } finally {
      setPasswordSaving(false)
    }
  }

  const openDeletePrompt = () => {
    setDeletePromptOpen(true)
  }

  const closeDeletePrompt = () => {
    setDeletePromptOpen(false)
  }

  const confirmDeleteAccount = async () => {
    setDeletePromptOpen(false)
    try {
      await deleteProfile()
    } catch {
      showToast('Unable to delete account right now.')
      return
    }
    localStorage.removeItem('blueapp:token')
    localStorage.removeItem(`blueapp:data:${currentEmail}`)
    setScreen('login')
    setView('dashboard')
  }

  const toggleOBContinent = (continent) => {
    setObContinents((current) =>
      current.includes(continent) ? current.filter((item) => item !== continent) : [...current, continent],
    )
  }

  const finishOnboarding = async () => {
    const nextData = {
      ...data,
      profile: {
        ...data.profile,
        selectedContinents: obContinents.length ? obContinents : ['Africa'],
        learningGoal: obGoal || 'Casual Learning',
        onboarded: true,
      },
    }
    setData(nextData)
    persistClientSide(nextData)
    const onboardingContinent = obContinents[0] || 'Africa'
    setActiveContinent(onboardingContinent)
    localStorage.setItem('blueapp:active-continent', onboardingContinent)
    try {
      await updateProfile({ profile: nextData.profile })
    } catch {
      // local fallback
    }
    setScreen('app')
    setView('dashboard')
  }

  const goto = (nextView) => {
    setView(nextView)
    setDeletePromptOpen(false)
    setLearnContinent(null)
    setCountryDetail(null)
    setSession(null)
    setQuiz(null)
    setResults(null)
    window.scrollTo(0, 0)
  }

  const goHome = () => {
    setView('dashboard')
    setDeletePromptOpen(false)
    setLearnContinent(null)
    setCountryDetail(null)
    setSession(null)
    setQuiz(null)
    setResults(null)
    window.scrollTo(0, 0)
  }

  const openContinent = (continent) => {
    setActiveContinent(continent)
    localStorage.setItem('blueapp:active-continent', continent)
    setLearnContinent(continent)
    setView('continent')
    window.scrollTo(0, 0)
  }

  const openCountry = (id) => {
    setCountryDetail(id)
    setView('country')
    window.scrollTo(0, 0)
  }

  const showToast = (message) => setToast(message)

  const startLearningSession = (continent, poolOverride) => {
    setActiveContinent(continent)
    localStorage.setItem('blueapp:active-continent', continent)
    let pool = poolOverride || countriesOf(continent).filter((country) => statusOf(data, country.id) !== 'mastered')
    if (pool.length === 0) pool = countriesOf(continent)
    pool = shuffle(pool).slice(0, Math.min(5, pool.length))
    setSession({ continent, pool, idx: 0, revealed: false, correctCount: 0, input: '' })
    setView('learn-session')
  }

  const sessionReveal = () => {
    setSession((current) => ({ ...current, revealed: true }))
  }

  const sessionMark = async (correct) => {
    const current = session
    if (!current) return
    const country = current.pool[current.idx]
    const nextData = structuredClone(data)
    recordAnswer(nextData, country.id, correct)
    if (correct) current.correctCount += 1
    addXP(nextData, correct ? 10 : 2)
    touchStreak(nextData)
    const newAchievements = checkAchievements(nextData)
    if (current.idx + 1 >= current.pool.length) {
      addXP(nextData, 50)
      const nextResults = {
        type: 'session',
        continent: current.continent,
        correct: current.correctCount,
        total: current.pool.length,
        xp: current.correctCount * 10 + 50,
        newAch: newAchievements,
      }
      setResults(nextResults)
      setSession(null)
      setView('session-complete')
    } else {
      setSession({
        ...current,
        idx: current.idx + 1,
        revealed: false,
        input: '',
      })
    }
    await saveAndSync(nextData)
  }

  const buildQuizQuestions = (pool, reverse) =>
    pool.map((country) => {
      const distractors = shuffle(countriesOf(country.continent).filter((item) => item.id !== country.id)).slice(0, 3)
      const options = shuffle([country, ...distractors])
      return { country, options, answered: false, selected: null, reverse }
    })

  const startPractice = (mode, continent) => {
    let pool
    if (mode === 'weak') pool = weakCountries(data, 12)
    else if (mode === 'review') pool = reviewDue(data)
    else pool = countriesOf(continent)
    if (pool.length === 0) {
      showToast('Nothing to practice here yet.')
      return
    }
    pool = shuffle(pool).slice(0, Math.min(mode === 'quick' ? 10 : 15, pool.length))
    const reverse = mode === 'reverse'
    setQuiz({ kind: 'practice', mode, continent, questions: buildQuizQuestions(pool, reverse), idx: 0, correct: 0, startedAt: Date.now() })
    setView('quiz-session')
  }

  const selectPracticeMode = (mode) => {
    if (mode === 'weak' || mode === 'review') {
      startPractice(mode)
      return
    }
    setView('practice')
    setQuiz({ kind: 'practice', mode, continent: null, questions: [], idx: 0, correct: 0 })
  }

  const startWeeklyTest = (continent) => {
    const pool = shuffle(countriesOf(continent)).slice(0, Math.min(30, countriesOf(continent).length))
    setQuiz({
      kind: 'weekly',
      continent,
      questions: buildQuizQuestions(pool, false),
      idx: 0,
      correct: 0,
      startedAt: Date.now(),
      timeLeft: pool.length * 15,
    })
    setView('quiz-session')
  }

  const selectOption = async (optionIndex) => {
    if (!quiz) return
    const currentQuestion = quiz.questions[quiz.idx]
    if (currentQuestion.answered) return
    currentQuestion.answered = true
    currentQuestion.selected = optionIndex
    const correct = currentQuestion.options[optionIndex].id === currentQuestion.country.id
    if (correct) quiz.correct += 1

    const nextData = structuredClone(data)
    recordAnswer(nextData, currentQuestion.country.id, correct)
    touchStreak(nextData)
    if (quiz.kind === 'weekly') {
      addXP(nextData, correct ? 10 : 2)
    }
    const newly = checkAchievements(nextData)
    await saveAndSync(nextData)
    setQuiz({ ...quiz })
    if (quiz.kind !== 'weekly') {
      setTimeout(() => nextQuizQuestion(newly), 800)
    }
  }

  const nextQuizQuestion = async (newly = []) => {
    if (!quiz) return
    if (quiz.idx + 1 >= quiz.questions.length) {
      finishQuiz()
      return
    }
    setQuiz({ ...quiz, idx: quiz.idx + 1 })
    if (newly.length) showToast(`Unlocked ${newly.length} achievement${newly.length > 1 ? 's' : ''}.`)
  }

  const finishQuiz = async (quizOverride = quiz) => {
    if (!quizOverride) return
    if (timerRef.current) clearInterval(timerRef.current)
    const total = quizOverride.questions.length
    const correct = quizOverride.correct
    const pct = total ? Math.round((correct / total) * 100) : 0
    const nextData = structuredClone(data)
    addXP(nextData, quizOverride.kind === 'weekly' ? 100 : 20)
    if (quizOverride.kind === 'weekly' && pct >= 90) addXP(nextData, 25)
    touchStreak(nextData)
    const newAchievements = checkAchievements(nextData)
    if (quizOverride.kind === 'weekly') {
      nextData.quizAttempts.push({
        id: Date.now(),
        continent: quizOverride.continent,
        score: correct,
        total,
        percentage: pct,
        completedAt: new Date().toISOString(),
      })
      try {
        await createQuizAttempt({
          continent: quizOverride.continent,
          score: correct,
          total,
          percentage: pct,
        })
      } catch {
        // local fallback
      }
    }
    await saveAndSync(nextData)
    const answered = quizOverride.questions
    const strong = answered.filter((q) => q.selected !== null && q.options[q.selected].id === q.country.id).slice(0, 3)
    const weak = answered.filter((q) => !(q.selected !== null && q.options[q.selected].id === q.country.id)).slice(0, 4)
    setResults({ type: quizOverride.kind, continent: quizOverride.continent, correct, total, pct, strong, weak, newAch: newAchievements })
    setQuiz(null)
    setView('quiz-results')
  }

  const toggleNotif = async () => {
    const nextData = structuredClone(data)
    nextData.profile.notifPrefs.weeklyReminder = !nextData.profile.notifPrefs.weeklyReminder
    await saveAndSync(nextData)
  }

  const practiceOneCountry = (id) => {
    const country = COUNTRIES.find((item) => item.id === id)
    if (!country) return
    setQuiz({ kind: 'practice', mode: 'single', continent: country.continent, questions: buildQuizQuestions([country], false), idx: 0, correct: 0 })
    setView('quiz-session')
  }

  useEffect(() => {
    if (screen !== 'app') {
      setWeeklyPrompt(null)
      return undefined
    }

    if (view === 'weekly' || view === 'quiz-session' || view === 'quiz-results' || view === 'session-complete') {
      setWeeklyPrompt(null)
      return undefined
    }

    const reminder = weeklyReminderState()
    if (!reminder) {
      setWeeklyPrompt(null)
      return undefined
    }

    const dismissKey = `blueapp:weekly-prompt-dismissed:${reminder.phase}`
    if (localStorage.getItem(dismissKey) === todayStr()) {
      setWeeklyPrompt(null)
      return undefined
    }

    setWeeklyPrompt(reminder)
    return undefined
  }, [screen, view, data.quizAttempts, data.profile?.notifPrefs?.weeklyReminder, data.profile?.selectedContinents?.join('|')])

  const shellWrap = (content) => {
    const profile = data.profile
    const initials = (profile.fullName || '?')
      .split(' ')
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
    const nav = [
      { id: 'dashboard', ic: '🏠', label: 'Dashboard' },
      { id: 'learn', ic: '📚', label: 'Learn' },
      { id: 'practice', ic: '✏️', label: 'Practice' },
      { id: 'weekly', ic: '🗓️', label: 'Weekly Tests' },
      { id: 'progress', ic: '📈', label: 'Progress' },
      { id: 'profile', ic: '👤', label: 'Profile' },
    ]
    const activeTop =
      view === 'dashboard'
        ? 'dashboard'
        : ['learn', 'continent', 'country', 'learn-session', 'session-complete'].includes(view)
          ? 'learn'
          : ['practice', 'quiz-session', 'quiz-results'].includes(view) && quiz?.kind === 'practice'
            ? 'practice'
            : ['practice', 'quiz-session', 'quiz-results'].includes(view) && quiz?.kind === 'weekly'
              ? 'weekly'
              : view

    return (
      <div className="shell">
        <aside className="sidebar">
          <div className="logo-row">
            {logoMark()}
            <span>BlueApp</span>
          </div>
          <nav className="navlist">
            {nav.map((item) => (
              <button key={item.id} type="button" className={`navitem ${activeTop === item.id ? 'active' : ''}`} onClick={() => goto(item.id)}>
                <span className="ic">{item.ic}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            {avatarNode(profile, initials, 36)}
            <div className="sidebar-user">
              <div className="name">{profile.fullName}</div>
              <div className="mail">{profile.email}</div>
            </div>
            <button type="button" className="icon-btn" title="Settings" onClick={() => goto('settings')}>
              ⚙️
            </button>
            <button type="button" className="icon-btn" title="Logout" onClick={doLogout}>
              ⎋
            </button>
          </div>
        </aside>
        <main className="main">{content}</main>
        <nav className="bottomnav">
          {nav.map((item) => (
            <button key={item.id} type="button" className={`bn-item ${activeTop === item.id ? 'active' : ''}`} onClick={() => goto(item.id)}>
              <div className="ic">{item.ic}</div>
              {item.label.split(' ')[0]}
            </button>
          ))}
        </nav>
        {toast ? <div className="toast">✨ {toast}</div> : null}
        {weeklyPrompt ? (
          <div className="weekly-modal-overlay" role="presentation">
            <div className="weekly-modal" role="dialog" aria-modal="true" aria-labelledby="weekly-reminder-title">
              <div className="weekly-modal-top">
                <div>
                  <div className="pill" style={{ marginBottom: 10 }}>
                    {weeklyPrompt.phase === 'today' ? 'Due today' : 'Due tomorrow'}
                  </div>
                  <h3 id="weekly-reminder-title" style={{ fontSize: 20 }}>
                    Your weekly test is {weeklyPrompt.phase === 'today' ? 'ready now' : 'coming tomorrow'}
                  </h3>
                </div>
                <button type="button" className="weekly-modal-close" aria-label="Dismiss reminder" onClick={dismissWeeklyPrompt}>
                  ×
                </button>
              </div>
              <p className="helper" style={{ marginTop: 10 }}>
                {weeklyPrompt.phase === 'today'
                  ? `You can take your ${weeklyPrompt.continent} test now.`
                  : `Your ${weeklyPrompt.continent} weekly test will be ready tomorrow.`}
              </p>
              <div className="weekly-modal-actions">
                {weeklyPrompt.phase === 'today' ? (
                  <button type="button" className="btn btn-primary" onClick={takeWeeklyTestNow}>
                    Take Test
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
        {deletePromptOpen ? (
          <div className="weekly-modal-overlay" role="presentation">
            <div className="weekly-modal" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
              <div className="weekly-modal-top">
                <div>
                  <h3 id="delete-account-title" style={{ fontSize: 20 }}>
                    Do you want to delete your account?
                  </h3>
                </div>
                <button type="button" className="weekly-modal-close" aria-label="Cancel delete account" onClick={closeDeletePrompt}>
                  ×
                </button>
              </div>
              <p className="helper" style={{ marginTop: 10 }}>
                This will permanently remove your account, profile, and progress.
              </p>
              <div className="weekly-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeDeletePrompt}>
                  No
                </button>
                <button type="button" className="btn btn-primary" onClick={confirmDeleteAccount}>
                  Yes
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {passwordModalOpen ? (
          <div className="weekly-modal-overlay" role="presentation">
            <div className="weekly-modal" role="dialog" aria-modal="true" aria-labelledby="change-password-title">
              <div className="weekly-modal-top">
                <div>
                  <h3 id="change-password-title" style={{ fontSize: 20 }}>
                    Change your password
                  </h3>
                </div>
                <button type="button" className="weekly-modal-close" aria-label="Close password dialog" onClick={closePasswordModal}>
                  ×
                </button>
              </div>
              <form onSubmit={submitPasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
                <div className="field">
                  <label>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showCurrentPassword ? 'text' : 'password'} name="currentPassword" required style={{ paddingRight: 46 }} />
                    <button
                      type="button"
                      aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                      onClick={() => setShowCurrentPassword((current) => !current)}
                      style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: 8, color: 'var(--taupe)' }}
                    >
                      {passwordEyeIcon(showCurrentPassword)}
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showNewPassword ? 'text' : 'password'} name="newPassword" required style={{ paddingRight: 46 }} />
                    <button
                      type="button"
                      aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                      onClick={() => setShowNewPassword((current) => !current)}
                      style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: 8, color: 'var(--taupe)' }}
                    >
                      {passwordEyeIcon(showNewPassword)}
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label>Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required style={{ paddingRight: 46 }} />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: 8, color: 'var(--taupe)' }}
                    >
                      {passwordEyeIcon(showConfirmPassword)}
                    </button>
                  </div>
                </div>
                {passwordError ? <p className="helper" style={{ color: 'var(--review)' }}>{passwordError}</p> : null}
                {passwordSuccess ? <p className="helper" style={{ color: 'var(--burgundy)' }}>{passwordSuccess}</p> : null}
                <div className="weekly-modal-actions" style={{ justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={closePasswordModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={passwordSaving}>
                    {passwordSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  const weeklyTestCard = (continent) => {
    const latest = data.quizAttempts
      .filter((attempt) => attempt.continent === continent)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0]
    const isThisWeek = latest && Date.now() - new Date(latest.completedAt).getTime() < 7 * 86400000
    const total = countriesOf(continent).length
    const questions = Math.min(30, total)
    if (isThisWeek) {
      return (
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h4 style={{ fontSize: 16 }}>{CONTINENT_EMOJI[continent]} {continent} Weekly Assessment</h4>
            <p className="helper">Completed · Score: {latest.percentage}%</p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => {
            setResults({ type: 'weekly', continent, correct: latest.score, total: latest.total, pct: latest.percentage, strong: [], weak: [], newAch: [], fromHistory: true })
            setView('quiz-results')
          }}>
            View Results
          </button>
        </div>
      )
    }
    return (
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h4 style={{ fontSize: 16 }}>{CONTINENT_EMOJI[continent]} {continent} Weekly Assessment</h4>
          <p className="helper">{questions} Questions · Approximately {Math.ceil(questions / 6)} minutes</p>
          <p className="helper">Test what you've learned this week and discover which capitals need more practice.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => startWeeklyTest(continent)}>
          Start Test
        </button>
      </div>
    )
  }

  const dashboardBody = () => {
    const hour = new Date().getHours()
    const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
    const mastery = overallMastery(data)
    const learned = countriesLearned(data)
    const selected = data.profile.selectedContinents.length ? data.profile.selectedContinents : ['Africa']
    const feature = selected
      .map((continent) => ({ continent, mastery: continentMastery(data, continent) }))
      .sort((a, b) => b.mastery - a.mastery)[0] || { continent: 'Africa', mastery: 0 }
    const featCountries = countriesOf(feature.continent)
    const featMastered = masteredCount(data, feature.continent)
    const weak = weakCountries(data, 3)

    return (
      <>
        <div className="page-header">
          <h1 style={{ fontSize: 26 }}>{greet}, {data.profile.fullName.split(' ')[0]} 👋</h1>
          <p>Keep building your geography knowledge.</p>
        </div>
        <div className="stat-grid">
          <div className="stat-card"><div className="label">Overall Mastery</div><div className="value">{mastery}%</div></div>
          <div className="stat-card"><div className="label">Countries Learned</div><div className="value">{learned} / {COUNTRIES.length}</div></div>
          <div className="stat-card"><div className="label">Current Streak</div><div className="value">{data.profile.streak}d 🔥</div><div className="sub">Longest: {data.profile.longestStreak} days</div></div>
          <div className="stat-card"><div className="label">XP</div><div className="value mono">{data.profile.xp.toLocaleString()}</div></div>
        </div>

        <div className="continue-card">
          <div className="info">
            <div className="pill">Continue Learning</div>
            <h2>{CONTINENT_EMOJI[feature.continent]} {feature.continent}</h2>
            <div className="meta">{featMastered} / {featCountries.length} countries mastered</div>
            <div className="bar-wrap" style={{ maxWidth: 280 }}>
              <div className="progressbar"><div style={{ width: `${feature.mastery}%` }} /></div>
            </div>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => openContinent(feature.continent)}>
            Continue Learning →
          </button>
        </div>

        <div className="section-title">
          <h3>Your Weekly Test</h3>
          <button type="button" onClick={() => goto('weekly')}>View all →</button>
        </div>
        {weeklyTestCard(feature.continent)}

        <div className="section-title">
          <h3>Needs Your Attention</h3>
          <button type="button" onClick={() => goto('practice')}>Review all →</button>
        </div>
        {weak.length === 0 ? emptyState('✅', 'All caught up', 'No weak areas right now - nice work.') : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {weak.map((country) => (
              <div className="country-row" key={country.id} onClick={() => openCountry(country.id)}>
                <div className="flag">{flagEmoji(country.code)}</div>
                <div className="names">
                  <div className="n">{country.name}</div>
                  <div className="c">Capital: {country.capital}</div>
                </div>
                <span className="badge badge-review">{masteryOf(data, country.id)}%</span>
                <button type="button" className="btn btn-secondary" onClick={(event) => { event.stopPropagation(); openContinent(country.continent) }}>
                  Review
                </button>
              </div>
            ))}
          </div>
        )}
      </>
    )
  }

  const learnBody = () => (
    <>
      <div className="page-header">
        <h1 style={{ fontSize: 26 }}>Learn by Continent</h1>
        <p>Choose a continent and start mastering its capitals.</p>
      </div>
      <div className="grid-3">
        {CONTINENTS.map((continent) => {
          const countries = countriesOf(continent)
          const mastery = continentMastery(data, continent)
          const mastered = masteryOf(data, continent)
          return (
            <div key={continent} className="continent-card" onClick={() => openContinent(continent)}>
              <div className="top">
                <div className="emoji">{CONTINENT_EMOJI[continent]}</div>
                <div className="pct">{mastery}%</div>
              </div>
              <h4>{continent}</h4>
              <div className="cnt">{countries.length} countries · {masteredCount(data, continent)} mastered</div>
              <div style={{ marginTop: 12 }}>
                <div className="progressbar"><div style={{ width: `${mastered}%` }} /></div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="section-title">
        <h3>World Overview</h3>
      </div>
      <div className="worldmap">
        <p className="helper">A quick glance at your mastery across the globe. Tap a region to jump in.</p>
        <div className="wm-grid">
          {CONTINENTS.map((continent) => {
            const mastery = continentMastery(data, continent)
            const dotColor = mastery >= 80 ? 'var(--mastered)' : mastery >= 50 ? 'var(--improving)' : mastery > 0 ? 'var(--review)' : 'var(--notstarted)'
            return (
              <div key={continent} className="wm-item" onClick={() => openContinent(continent)}>
                <div className="wm-dot" style={{ background: dotColor }} />
                <div className="emoji">{CONTINENT_EMOJI[continent]}</div>
                <div style={{ fontWeight: 600, fontSize: 13.5, marginTop: 6 }}>{continent}</div>
                <div className="helper">{mastery}% mastery</div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )

  const continentBody = () => {
    const continent = learnContinent || 'Africa'
    const countries = countriesOf(continent)
    const mastery = continentMastery(data, continent)
    const regions = [...new Set(countries.map((country) => country.region))]
    return (
      <>
        <button type="button" className="btn btn-ghost" style={{ paddingLeft: 0, marginBottom: 6 }} onClick={() => goto('learn')}>
          ← All Continents
        </button>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h1 style={{ fontSize: 26 }}>{CONTINENT_EMOJI[continent]} {continent}</h1>
            <p>{countries.length} Countries · {mastery}% Mastery</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => startLearningSession(continent)}>
            Start Learning Session
          </button>
        </div>
        <div className="progressbar" style={{ marginBottom: 10 }}>
          <div style={{ width: `${mastery}%` }} />
        </div>
        {regions.map((region) => (
          <div key={region}>
            <div className="section-title" style={{ marginBottom: 10 }}>
              <h3>{region}</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {countries.filter((country) => country.region === region).map((country) => (
                <div className="country-row" key={country.id} onClick={() => openCountry(country.id)}>
                  <div className="flag">{flagEmoji(country.code)}</div>
                  <div className="names">
                    <div className="n">{country.name}</div>
                    <div className="c">{country.capital}</div>
                  </div>
                  <div className="m">
                    <div className="progressbar"><div style={{ width: `${masteryOf(data, country.id)}%` }} /></div>
                  </div>
                  <span className={`badge badge-${statusOf(data, country.id)}`}>{statusOf(data, country.id)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </>
    )
  }

  const countryDetailBody = () => {
    const country = COUNTRIES.find((item) => item.id === countryDetail)
    if (!country) return null
    const progress = data.progress[country.id] || { correct: 0, wrong: 0, lastAnswered: null, nextReview: null }
    const mastery = masteryOf(data, country.id)
    return (
      <>
        <button type="button" className="btn btn-ghost" style={{ paddingLeft: 0, marginBottom: 6 }} onClick={() => openContinent(country.continent)}>
          ← Back to {country.continent}
        </button>
        <div className="card" style={{ maxWidth: 560 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52 }}>{flagEmoji(country.code)}</div>
            <h1 style={{ fontSize: 26, marginTop: 8 }}>{country.name}</h1>
            <p style={{ color: 'var(--taupe)', marginTop: 4 }}>
              Capital: <strong style={{ color: 'var(--brown)' }}>{country.capital}</strong>
            </p>
            <div className="mono" style={{ fontSize: 22, color: 'var(--burgundy)', marginTop: 10 }}>{mastery}% Mastery</div>
            <div className="progressbar" style={{ margin: '10px auto', maxWidth: 280 }}>
              <div style={{ width: `${mastery}%` }} />
            </div>
          </div>
          <div className="grid-2" style={{ marginTop: 22 }}>
            <div className="card-cream" style={{ borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div className="helper">Continent</div>
              <div style={{ fontWeight: 600, marginTop: 4 }}>{country.continent}</div>
            </div>
            <div className="card-cream" style={{ borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div className="helper">Region</div>
              <div style={{ fontWeight: 600, marginTop: 4 }}>{country.region}</div>
            </div>
            <div className="card-cream" style={{ borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div className="helper">Correct Answers</div>
              <div style={{ fontWeight: 600, marginTop: 4, color: 'var(--mastered)' }}>{progress.correct}</div>
            </div>
            <div className="card-cream" style={{ borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div className="helper">Incorrect Answers</div>
              <div style={{ fontWeight: 600, marginTop: 4, color: 'var(--review)' }}>{progress.wrong}</div>
            </div>
            <div className="card-cream" style={{ borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div className="helper">Last Reviewed</div>
              <div style={{ fontWeight: 600, marginTop: 4 }}>{progress.lastAnswered ? new Date(progress.lastAnswered).toLocaleDateString() : '—'}</div>
            </div>
            <div className="card-cream" style={{ borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div className="helper">Next Review</div>
              <div style={{ fontWeight: 600, marginTop: 4 }}>{progress.nextReview ? new Date(progress.nextReview).toLocaleDateString() : '—'}</div>
            </div>
          </div>
          <p className="helper" style={{ marginTop: 20, lineHeight: 1.6 }}>💡 {capitalizeFact(country)}</p>
          <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={() => practiceOneCountry(country.id)}>
            Practice This Country
          </button>
        </div>
      </>
    )
  }

  const learnSessionBody = () => {
    if (!session) return null
    const current = session.pool[session.idx]
    const pct = Math.round((session.idx / session.pool.length) * 100)
    return (
      <div className="session-wrap">
        <button type="button" className="btn btn-ghost" style={{ paddingLeft: 0 }} onClick={() => openContinent(session.continent)}>
          ✕ Exit Session
        </button>
        <div className="session-progress">
          <div className="progressbar" style={{ flex: 1 }}><div style={{ width: `${pct}%` }} /></div>
          <div className="txt">Question {session.idx + 1} of {session.pool.length}</div>
        </div>
        <div className="flashcard">
          <div className="flagbig">{flagEmoji(current.code)}</div>
          <h2>{current.name}</h2>
          {!session.revealed ? (
            <>
              <div style={{ marginTop: 12 }}>What is the capital of {current.name}?</div>
              <button type="button" className="btn btn-primary" style={{ marginTop: 18 }} onClick={sessionReveal}>
                Reveal Answer
              </button>
            </>
          ) : (
            <>
              <div style={{ color: 'var(--mastered)', fontWeight: 700, fontSize: 22, marginTop: 12 }}>{current.capital}</div>
              <div style={{ color: 'var(--mastered)', fontWeight: 700, fontSize: 13.5 }}>✓ Correct!</div>
              <div style={{ marginTop: 12, color: 'var(--taupe)' }}>{capitalizeFact(current)}</div>
            </>
          )}
        </div>
        {session.revealed ? (
          <div className="session-actions">
            <button type="button" className="btn btn-secondary" onClick={() => sessionMark(false)}>I got it wrong</button>
            <button type="button" className="btn btn-primary" onClick={() => sessionMark(true)}>I knew this</button>
          </div>
        ) : null}
      </div>
    )
  }

  const sessionCompleteBody = () => {
    if (!results) return null
    return (
      <div className="session-wrap" style={{ textAlign: 'center' }}>
        <div className="results-hero">
          <div style={{ fontSize: 44 }}>🎉</div>
          <h1 style={{ marginTop: 6 }}>Session Complete!</h1>
          <div className="big">{results.correct}/{results.total}</div>
          <p className="helper">+{results.xp} XP earned</p>
        </div>
        {results.newAch?.length ? (
          <div className="card-nude" style={{ borderRadius: 16, padding: 16, margin: '16px 0' }}>
            <div style={{ fontWeight: 700, color: 'var(--wine)', marginBottom: 8 }}>🏆 Achievement Unlocked</div>
            {results.newAch.map((achievement) => (
              <div key={achievement.id} style={{ fontSize: 13.5 }}>
                {achievement.icon} <strong>{achievement.name}</strong> - {achievement.desc}
              </div>
            ))}
          </div>
        ) : null}
        <div className="session-actions">
          <button type="button" className="btn btn-secondary" onClick={() => openContinent(results.continent)}>
            Back to {results.continent}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => startLearningSession(results.continent)}>
            Learn More
          </button>
        </div>
      </div>
    )
  }

  const practiceBody = () => {
    const modes = [
      { id: 'mc', ic: '🔤', name: 'Multiple Choice', desc: 'Pick the correct capital from four options.' },
      { id: 'reverse', ic: '🔁', name: 'Reverse Questions', desc: 'Given the capital, name the country.' },
      { id: 'quick', ic: '⚡', name: 'Quick Practice', desc: 'A fast 10-question round.' },
      { id: 'weak', ic: '🎯', name: 'Weak Areas', desc: 'Focus on your lowest-mastery countries.' },
      { id: 'review', ic: '🔄', name: 'Review Queue', desc: 'Capitals that are due for spaced review.' },
    ]
    const due = reviewDue(data).length
    return (
      <>
        <div className="page-header">
          <h1 style={{ fontSize: 26 }}>Practice</h1>
          <p>Choose a mode to sharpen your recall.</p>
        </div>
        <div className="grid-3">
          {modes.map((mode) => (
            <div key={mode.id} className="continent-card" onClick={() => selectPracticeMode(mode.id)}>
              <div className="emoji">{mode.ic}</div>
              <h4>{mode.name}</h4>
              <div className="cnt">{mode.desc}</div>
              {mode.id === 'review' ? <div className="pill" style={{ marginTop: 10 }}>{due} due</div> : null}
            </div>
          ))}
        </div>
        {quiz?.mode && !['weak', 'review'].includes(quiz.mode) ? (
          <>
            <div className="section-title">
              <h3>Choose a continent</h3>
            </div>
            <div className="grid-3">
              {CONTINENTS.map((continent) => (
                <div key={continent} className="continent-card" onClick={() => startPractice(quiz.mode, continent)}>
                  <div className="emoji">{CONTINENT_EMOJI[continent]}</div>
                  <h4>{continent}</h4>
                  <div className="cnt">{countriesOf(continent).length} countries</div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </>
    )
  }

  const quizSessionBody = () => {
    if (!quiz) return null
    const current = quiz.questions[quiz.idx]
    const pct = Math.round((quiz.idx / quiz.questions.length) * 100)
    const isReverse = current.reverse
    const promptTitle = isReverse
      ? `Which country's capital is ${current.country.capital}?`
      : `What is the capital of ${current.country.name}?`
    return (
      <div className="session-wrap">
        <button type="button" className="btn btn-ghost" style={{ paddingLeft: 0 }} onClick={() => goto('practice')}>
          ✕ Exit
        </button>
        <div className="session-progress">
          <div className="progressbar" style={{ flex: 1 }}><div style={{ width: `${pct}%` }} /></div>
          <div className="txt">{quiz.idx + 1} / {quiz.questions.length}</div>
          {quiz.kind === 'weekly' ? <div className="timer-pill">{Math.floor(quiz.timeLeft / 60)}:{String(quiz.timeLeft % 60).padStart(2, '0')}</div> : null}
        </div>
        <div className="flashcard" style={{ minHeight: 'auto', padding: '36px 28px' }}>
          {!isReverse ? <div className="flagbig">{flagEmoji(current.country.code)}</div> : null}
          <div style={{ fontSize: 18, color: 'var(--brown)' }}>{promptTitle}</div>
        </div>
        <div className="quiz-options">
          {current.options.map((option, index) => {
            let className = 'qopt'
            if (current.answered) {
              if (index === current.selected) className += option.id === current.country.id ? ' correct' : ' wrong'
              else if (option.id === current.country.id) className += ' correct'
            }
            const label = isReverse ? option.name : option.capital
            return (
              <button key={option.id} type="button" className={className} onClick={() => selectOption(index)} disabled={current.answered}>
                {label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const resultsBody = () => {
    if (!results) return null
    const mastered = masteredCount(data, results.continent)
    const improving = countriesOf(results.continent).filter((country) => statusOf(data, country.id) === 'improving').length
    const needsReview = countriesOf(results.continent).filter((country) => statusOf(data, country.id) === 'review').length
    return (
      <div className="session-wrap">
        <div className="results-hero">
          <div style={{ fontSize: 44 }}>{results.pct >= 70 ? '🎉' : '💪'}</div>
          <h1 style={{ marginTop: 4 }}>{results.pct >= 70 ? 'Great Work!' : 'Keep Going!'}</h1>
          <div className="big">{results.pct}%</div>
          <p className="helper">{results.correct} / {results.total} Correct</p>
        </div>
        <div className="breakdown">
          <div className="item">🟢 Mastered: {mastered}</div>
          <div className="item">🟡 Improving: {improving}</div>
          <div className="item">🔴 Needs Review: {needsReview}</div>
        </div>
        {results.newAch?.length ? (
          <div className="card-nude" style={{ borderRadius: 16, padding: 16, margin: '16px 0' }}>
            <div style={{ fontWeight: 700, color: 'var(--wine)', marginBottom: 8 }}>🏆 Achievement Unlocked</div>
            {results.newAch.map((achievement) => (
              <div key={achievement.id} style={{ fontSize: 13.5 }}>
                {achievement.icon} <strong>{achievement.name}</strong> - {achievement.desc}
              </div>
            ))}
          </div>
        ) : null}
        {results.strong?.length ? (
          <>
            <div className="section-title"><h3>Strong Areas</h3></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {results.strong.map((question) => (
                <div className="country-row" key={question.country.id}>
                  <div className="flag">{flagEmoji(question.country.code)}</div>
                  <div className="names">
                    <div className="n">{question.country.name}</div>
                    <div className="c">{question.country.capital}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
        {results.weak?.length ? (
          <>
            <div className="section-title"><h3>Needs Review</h3></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {results.weak.map((question) => (
                <div className="country-row" key={question.country.id}>
                  <div className="flag">{flagEmoji(question.country.code)}</div>
                  <div className="names">
                    <div className="n">{question.country.name}</div>
                    <div className="c">{question.country.capital}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
        <div className="session-actions">
          <button type="button" className="btn btn-secondary" onClick={() => openContinent(results.continent)}>
            Review Weak Areas
          </button>
          <button type="button" className="btn btn-primary" onClick={() => startWeeklyTest(results.continent)}>
            Practice Again
          </button>
        </div>
      </div>
    )
  }

  const progressBody = () => {
    const mastery = overallMastery(data)
    const days = []
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push(date)
    }
    const maxActivity = Math.max(1, ...days.map((date) => data.activity[date.toISOString().slice(0, 10)] || 0))
    const totalAnswered = Object.values(data.activity).reduce((sum, value) => sum + value, 0)
    const attempts = data.quizAttempts
    const testAvg = attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length) : 0
    const totalCorrect = COUNTRIES.reduce((sum, country) => sum + (data.progress[country.id]?.correct || 0), 0)
    const totalWrong = COUNTRIES.reduce((sum, country) => sum + (data.progress[country.id]?.wrong || 0), 0)
    const acc = totalCorrect + totalWrong ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0

    return (
      <>
        <div className="page-header">
          <h1 style={{ fontSize: 26 }}>Progress</h1>
          <p>Your learning analytics, all in one place.</p>
        </div>
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16 }}>Overall Mastery</h3>
            <div className="mono" style={{ color: 'var(--burgundy)', fontSize: 20 }}>{mastery}%</div>
          </div>
          <div className="progressbar" style={{ marginTop: 10 }}><div style={{ width: `${mastery}%` }} /></div>
        </div>
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>Continent Progress</h3>
          {CONTINENTS.map((continent) => {
            const continentMasteryValue = continentMastery(data, continent)
            return (
              <div key={continent} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 5 }}>
                  <span>{CONTINENT_EMOJI[continent]} {continent}</span>
                  <span className="mono" style={{ color: 'var(--brown)' }}>{continentMasteryValue}%</span>
                </div>
                <div className="progressbar"><div style={{ width: `${continentMasteryValue}%` }} /></div>
              </div>
            )
          })}
        </div>
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, marginBottom: 6 }}>Learning Activity</h3>
          <p className="helper" style={{ marginBottom: 10 }}>Questions answered per day, this week.</p>
          <div className="chart" style={{ display: 'flex', alignItems: 'flex-end', gap: 12, minHeight: 160 }}>
            {days.map((date) => {
              const key = date.toISOString().slice(0, 10)
              const value = data.activity[key] || 0
              const height = Math.max(4, Math.round((value / maxActivity) * 120))
              const isToday = key === todayStr()
              return (
                <div key={key} className="col" style={{ flex: 1, textAlign: 'center' }}>
                  <div className={`bar ${isToday ? 'today' : ''}`} style={{ height, background: isToday ? 'var(--burgundy)' : 'var(--nude)', borderRadius: 12 }} title={`${value} questions`} />
                  <div className="lbl" style={{ fontSize: 11, color: 'var(--taupe)', marginTop: 6 }}>{dayName(date)}</div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="grid-2">
          <div className="stat-card"><div className="label">Practice Accuracy</div><div className="value">{acc}%</div></div>
          <div className="stat-card"><div className="label">Weekly Test Average</div><div className="value">{testAvg}%</div></div>
          <div className="stat-card"><div className="label">Questions Answered</div><div className="value mono">{totalAnswered}</div></div>
          <div className="stat-card"><div className="label">Capitals Mastered</div><div className="value">{countries.filter((country) => statusOf(data, country.id) === 'mastered').length}</div></div>
        </div>
      </>
    )
  }

  const profileBody = () => {
    const profile = data.profile
    const initials = (profile.fullName || '?')
      .split(' ')
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
    return (
      <>
        <div className="page-header"><h1 style={{ fontSize: 26 }}>Profile</h1></div>
        <div className="card" style={{ textAlign: 'center', maxWidth: 420, marginBottom: 20 }}>
          <div style={{ margin: '0 auto', width: 64, height: 64 }}>
            {avatarNode(profile, initials, 64)}
          </div>
          <h2 style={{ marginTop: 12, fontSize: 20 }}>{profile.fullName}</h2>
          <p className="helper">{profile.email}</p>
          <p className="helper">Member since {new Date(profile.createdAt).toLocaleDateString()}</p>
          <div className="grid-2" style={{ marginTop: 18, textAlign: 'left' }}>
            <div className="card-cream" style={{ borderRadius: 12, padding: 12, textAlign: 'center' }}><div className="helper">XP</div><div style={{ fontWeight: 700, color: 'var(--burgundy)', marginTop: 2 }}>{profile.xp.toLocaleString()}</div></div>
            <div className="card-cream" style={{ borderRadius: 12, padding: 12, textAlign: 'center' }}><div className="helper">Current Streak</div><div style={{ fontWeight: 700, marginTop: 2 }}>{profile.streak}d</div></div>
            <div className="card-cream" style={{ borderRadius: 12, padding: 12, textAlign: 'center' }}><div className="helper">Longest Streak</div><div style={{ fontWeight: 700, marginTop: 2 }}>{profile.longestStreak}d</div></div>
            <div className="card-cream" style={{ borderRadius: 12, padding: 12, textAlign: 'center' }}><div className="helper">Countries Mastered</div><div style={{ fontWeight: 700, marginTop: 2 }}>{masteredCount(data)}</div></div>
          </div>
        </div>
        <div className="section-title"><h3>Achievements</h3></div>
        <div className="grid-3">
          {ACHIEVEMENTS.map((achievement) => {
            const earned = data.achievements.includes(achievement.id)
            return (
              <div key={achievement.id} className={`ach-card ${earned ? '' : 'locked'}`}>
                <div className="ic">{achievement.icon}</div>
                <h4>{achievement.name}</h4>
                <p>{achievement.desc}</p>
              </div>
            )
          })}
        </div>
        <div className="section-title"><h3>Account</h3></div>
        <div className="card" style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div className="settings-row" style={{ cursor: 'pointer' }} onClick={() => goto('settings')}><span>Account Settings</span><span>→</span></div>
          <div className="settings-row" style={{ cursor: 'pointer' }} onClick={doLogout}><span>Logout</span><span>⎋</span></div>
        </div>
      </>
    )
  }

  const settingsBody = () => {
    const profile = data.profile
    return (
      <>
        <button type="button" className="btn btn-ghost" style={{ paddingLeft: 0, marginBottom: 6 }} onClick={() => goto('profile')}>
          ← Profile
        </button>
        <div className="page-header"><h1 style={{ fontSize: 26 }}>Settings</h1></div>
        <div className="card" style={{ maxWidth: 480, marginBottom: 18 }}>
          <h3 style={{ fontSize: 15.5, marginBottom: 6 }}>Account Information</h3>
          <div className="settings-row"><span className="helper">Full Name</span><span>{profile.fullName}</span></div>
          <div className="settings-row"><span className="helper">Email</span><span>{profile.email}</span></div>
          <div className="settings-row" style={{ cursor: 'pointer' }} onClick={openPasswordModal}><span>Change Password</span><span>→</span></div>
        </div>
        <form onSubmit={saveProfileSettings}>
          <div className="card" style={{ maxWidth: 680, marginBottom: 18 }}>
            <h3 style={{ fontSize: 15.5, marginBottom: 6 }}>Edit Profile</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(180px, 220px)', gap: 20, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={settingsDraft?.fullName ?? profile.fullName}
                    onChange={(event) => updateSettingsDraft({ fullName: event.target.value })}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="field">
                  <label>Learning Goal</label>
                  <select value={settingsDraft?.learningGoal ?? profile.learningGoal} onChange={(event) => updateSettingsDraft({ learningGoal: event.target.value })}>
                    {['Casual Learning', 'Improve My Geography', 'Prepare for a Quiz', 'Become a Geography Expert'].map((goal) => (
                      <option key={goal} value={goal}>{goal}</option>
                    ))}
                  </select>
                </div>
                <div className="settings-row">
                  <span className="helper">Email</span>
                  <span>{profile.email}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 96, height: 96 }}>
                  {avatarNode(
                    settingsDraft || profile,
                    (settingsDraft?.fullName || profile.fullName || '?')
                      .split(' ')
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase(),
                    96,
                  )}
                </div>
                <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                  Upload Avatar
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                </label>
                {(settingsDraft?.avatarUrl || profile.avatarUrl) ? (
                  <button type="button" className="btn btn-ghost" onClick={() => updateSettingsDraft({ avatarUrl: '' })}>
                    Remove Avatar
                  </button>
                ) : null}
              </div>
            </div>
            {settingsMessage ? <p className="helper" style={{ marginTop: 12, color: 'var(--review)' }}>{settingsMessage}</p> : null}
            {settingsSuccess ? <p className="helper" style={{ marginTop: 12, color: 'var(--burgundy)' }}>{settingsSuccess}</p> : null}
            <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-primary" disabled={settingsSaving}>
                {settingsSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSettingsDraft({
                    fullName: profile.fullName || '',
                    learningGoal: profile.learningGoal || '',
                    avatarUrl: profile.avatarUrl || '',
                  })
                  setSettingsMessage('')
                  setSettingsSuccess('')
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </form>
        <div className="card" style={{ maxWidth: 480, marginBottom: 18 }}>
          <h3 style={{ fontSize: 15.5, marginBottom: 6 }}>Notifications</h3>
          <div className="settings-row">
            <span>Weekly test reminders</span>
            <button type="button" className={`switch ${profile.notifPrefs.weeklyReminder ? 'on' : ''}`} onClick={toggleNotif} />
          </div>
          <div className="settings-row">
            <span>Browser reminders</span>
            <button
              type="button"
              className={`switch ${browserReminderEnabled && typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'on' : ''}`}
              onClick={toggleBrowserReminders}
            />
          </div>
          <p className="helper" style={{ marginTop: 10 }}>
            Browser reminders only appear when you allow notifications in this browser.
          </p>
        </div>
        <div className="card" style={{ maxWidth: 480, marginBottom: 18 }}>
          <h3 style={{ fontSize: 15.5, marginBottom: 6 }}>Theme</h3>
          <p className="helper">BlueApp currently uses its signature warm burgundy palette.</p>
        </div>
        <div className="card" style={{ maxWidth: 480 }}>
          <div className="settings-row" style={{ cursor: 'pointer' }} onClick={doLogout}><span>Logout</span><span>⎋</span></div>
          <button type="button" className="settings-row" style={{ cursor: 'pointer', color: 'var(--review)', width: '100%', textAlign: 'left' }} onClick={openDeletePrompt}>
            <span>Delete Account</span><span>🗑️</span>
          </button>
        </div>
      </>
    )
  }

  const screens = useMemo(
    () => ({
      loading: <div className="centered-screen"><div className="mono" style={{ color: 'var(--taupe)' }}>Loading BlueApp...</div></div>,
      login: (
        <div className="centered-screen">
          <div className="auth-card">
            <div className="logo-row">{logoMark()}<span>BlueApp</span></div>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>Welcome back</h2>
            <p style={{ color: 'var(--taupe)', fontSize: 14, margin: '0 0 22px' }}>Log in to continue your geography journey.</p>
            <form onSubmit={doLogin}>
              <div className="field"><label>Email</label><input type="email" name="email" placeholder="you@example.com" required /></div>
              <div className="field">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showLoginPassword ? 'text' : 'password'} name="password" placeholder="••••••••" required style={{ paddingRight: 46 }} />
                  <button
                    type="button"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowLoginPassword((current) => !current)}
                    style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: 8, color: 'var(--taupe)' }}
                  >
                    {passwordEyeIcon(showLoginPassword)}
                  </button>
                </div>
              </div>
              {authError ? <div className="err" style={{ marginBottom: 14 }}>{authError}</div> : null}
              <button className="btn btn-primary btn-block" type="submit">Log In</button>
            </form>
            <div className="small-link"><button type="button" onClick={() => { setScreen('forgot'); setForgotSent(false) }}>Forgot password?</button></div>
            <div className="small-link">Don't have an account? <button type="button" onClick={() => setScreen('signup')}>Create one</button></div>
          </div>
        </div>
      ),
      signup: (
        <div className="centered-screen">
          <div className="auth-card">
            <div className="logo-row">{logoMark()}<span>BlueApp</span></div>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>Create your account</h2>
            <p style={{ color: 'var(--taupe)', fontSize: 14, margin: '0 0 22px' }}>Start mastering the world's capitals.</p>
            <form onSubmit={doSignup}>
              <div className="field"><label>Full Name</label><input type="text" name="fullName" placeholder="Ada Lovelace" required /></div>
              <div className="field"><label>Email</label><input type="email" name="email" placeholder="you@example.com" required /></div>
              <div className="field">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showSignupPassword ? 'text' : 'password'} name="password" placeholder="At least 6 characters" required style={{ paddingRight: 46 }} />
                  <button
                    type="button"
                    aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowSignupPassword((current) => !current)}
                    style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: 8, color: 'var(--taupe)' }}
                  >
                    {passwordEyeIcon(showSignupPassword)}
                  </button>
                </div>
              </div>
              <div className="field">
                <label>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showSignupConfirmPassword ? 'text' : 'password'} name="confirmPassword" required style={{ paddingRight: 46 }} />
                  <button
                    type="button"
                    aria-label={showSignupConfirmPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowSignupConfirmPassword((current) => !current)}
                    style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: 8, color: 'var(--taupe)' }}
                  >
                    {passwordEyeIcon(showSignupConfirmPassword)}
                  </button>
                </div>
              </div>
              {signupError ? <div className="err" style={{ marginBottom: 14 }}>{signupError}</div> : null}
              <button className="btn btn-primary btn-block" type="submit">Create Account</button>
            </form>
            <div className="small-link">Already have an account? <button type="button" onClick={() => setScreen('login')}>Log in</button></div>
          </div>
        </div>
      ),
      forgot: (
        <div className="centered-screen">
          <div className="auth-card">
            <div className="logo-row">{logoMark()}<span>BlueApp</span></div>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>Reset your password</h2>
            <p style={{ color: 'var(--taupe)', fontSize: 14, margin: '0 0 22px' }}>Enter your email and we'll send you a reset link.</p>
            {forgotSent ? (
              <div className="card-cream" style={{ borderRadius: 14, padding: 18, textAlign: 'center' }}>
                <div style={{ fontSize: 26 }}>📩</div>
                <p style={{ color: 'var(--brown)', fontSize: 14, marginTop: 8 }}>If an account exists for that email, a reset link is on its way.</p>
              </div>
            ) : (
              <form onSubmit={doForgot}>
                <div className="field"><label>Email Address</label><input type="email" name="email" placeholder="you@example.com" required /></div>
                <button className="btn btn-primary btn-block" type="submit">Send Reset Link</button>
              </form>
            )}
            <div className="small-link"><button type="button" onClick={() => setScreen('login')}>Back to log in</button></div>
          </div>
        </div>
      ),
      onboarding: (
        <div className="centered-screen">
          <div className="onboarding-panel">
            {onboardStep === 1 ? (
              <>
                <div style={{ fontSize: 52, marginBottom: 10 }}>🌍</div>
                <h1 style={{ fontSize: 28 }}>Welcome to BlueApp</h1>
                <p style={{ color: 'var(--taupe)', margin: '12px auto 30px', maxWidth: 340 }}>Master the world's capitals one continent at a time.</p>
                <button type="button" className="btn btn-primary" onClick={() => setOnboardStep(2)}>Let's Begin</button>
              </>
            ) : onboardStep === 2 ? (
              <>
                <h1 style={{ fontSize: 24, marginBottom: 6 }}>What would you like to learn first?</h1>
                <p className="helper" style={{ margin: '0 auto 20px', maxWidth: 360 }}>Choose one or more continents.</p>
                <div className="grid-3" style={{ maxWidth: 520, margin: '0 auto' }}>
                  {CONTINENTS.map((continent) => (
                    <div key={continent} className="continent-card" style={obContinents.includes(continent) ? { borderColor: 'var(--burgundy)', background: 'var(--cream)' } : {}} onClick={() => toggleOBContinent(continent)}>
                      <div className="emoji">{CONTINENT_EMOJI[continent]}</div>
                      <h4>{continent}</h4>
                      <div className="cnt">{countriesOf(continent).length} countries</div>
                    </div>
                  ))}
                </div>
                <button type="button" className="btn btn-primary" style={{ marginTop: 28 }} onClick={() => setOnboardStep(3)} disabled={!obContinents.length}>Continue</button>
              </>
            ) : onboardStep === 3 ? (
              <>
                <h1 style={{ fontSize: 24, marginBottom: 20 }}>What's your learning goal?</h1>
                <p className="helper" style={{ margin: '0 auto 20px', maxWidth: 360 }}>Pick the goal that best matches how you want to practice.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340, margin: '0 auto' }}>
                  {['Casual Learning', 'Improve My Geography', 'Prepare for a Quiz', 'Become a Geography Expert'].map((goal) => (
                    <button key={goal} type="button" className={`btn ${obGoal === goal ? 'btn-primary' : 'btn-secondary'} btn-block`} onClick={() => setObGoal(goal)}>{goal}</button>
                  ))}
                </div>
                <button type="button" className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => setOnboardStep(4)} disabled={!obGoal}>Continue</button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 52, marginBottom: 10 }}>🎉</div>
                <h1 style={{ fontSize: 28 }}>You're all set!</h1>
                <p style={{ color: 'var(--taupe)', margin: '12px auto 30px', maxWidth: 340 }}>Your personalized learning journey is ready.</p>
                <button type="button" className="btn btn-primary" onClick={finishOnboarding}>Start Learning</button>
              </>
            )}
          </div>
        </div>
      ),
      app: () =>
        shellWrap(
          view === 'dashboard'
            ? dashboardBody()
            : view === 'learn'
              ? learnBody()
              : view === 'continent'
                ? continentBody()
                : view === 'country'
                  ? countryDetailBody()
                  : view === 'learn-session'
                    ? learnSessionBody()
                    : view === 'session-complete'
                      ? sessionCompleteBody()
                      : view === 'practice'
                        ? practiceBody()
                        : view === 'quiz-session'
                          ? quizSessionBody()
                          : view === 'quiz-results'
                            ? resultsBody()
                            : view === 'weekly'
                              ? weeklyBody()
                              : view === 'progress'
                                ? progressBody()
                                : view === 'profile'
                                  ? profileBody()
                                  : settingsBody(),
        ),
    }),
    [
      authError,
      signupError,
      forgotSent,
      screen,
      view,
      data,
      countries,
      session,
      quiz,
      results,
      browserReminderEnabled,
      settingsDraft,
      settingsSaving,
      settingsMessage,
      settingsSuccess,
      passwordModalOpen,
      passwordSaving,
      passwordError,
      passwordSuccess,
      showLoginPassword,
      showSignupPassword,
      showSignupConfirmPassword,
      showCurrentPassword,
      showNewPassword,
      showConfirmPassword,
      weeklyPrompt,
      deletePromptOpen,
      obContinents,
      obGoal,
      onboardStep,
      learnContinent,
      countryDetail,
    ],
  )

  useEffect(() => {
    if (screen !== 'app') return undefined

    const state = { blueapp: 'home' }
    window.history.replaceState(state, document.title, window.location.href)

    const handlePopState = () => {
      goHome()
      window.history.pushState(state, document.title, window.location.href)
    }

    window.history.pushState(state, document.title, window.location.href)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [screen])

  function weeklyBody() {
    return (
      <>
        <div className="page-header">
          <h1 style={{ fontSize: 26 }}>Your Weekly Test</h1>
          <p>One assessment per continent, refreshed every week.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {CONTINENTS.map((continent) => {
            const attempts = data.quizAttempts.filter((attempt) => attempt.continent === continent).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
            const latest = attempts[0]
            const isThisWeek = latest && Date.now() - new Date(latest.completedAt).getTime() < 7 * 86400000
            const qn = Math.min(30, countriesOf(continent).length)
            return (
              <div key={continent} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <h4 style={{ fontSize: 16.5 }}>{CONTINENT_EMOJI[continent]} {continent} Weekly Assessment</h4>
                  <p className="helper" style={{ marginTop: 4 }}>{qn} Questions · Approximately {Math.ceil(qn / 6)} minutes</p>
                  {isThisWeek ? <p className="helper">Completed · Score: <strong style={{ color: 'var(--burgundy)' }}>{latest.percentage}%</strong></p> : <p className="helper">Test what you've learned and discover which capitals need more practice.</p>}
                </div>
                {isThisWeek ? <button type="button" className="btn btn-secondary" onClick={() => {
                  setResults({ type: 'weekly', continent, correct: latest.score, total: latest.total, pct: latest.percentage, strong: [], weak: [], newAch: [], fromHistory: true })
                  setView('quiz-results')
                }}>View Results</button> : <button type="button" className="btn btn-primary" onClick={() => startWeeklyTest(continent)}>Start Test</button>}
              </div>
            )
          })}
        </div>
      </>
    )
  }

  function routeBody() {
    if (screen === 'loading') return screens.loading
    if (screen === 'login') return screens.login
    if (screen === 'signup') return screens.signup
    if (screen === 'forgot') return screens.forgot
    if (screen === 'onboarding') return screens.onboarding
    if (screen === 'app') return screens.app()
    return (
      <div className="centered-screen">
        <div className="mono" style={{ color: 'var(--taupe)' }}>
          Something went wrong. Reloading to the login screen...
        </div>
      </div>
    )
  }

  return {
    screen,
    setScreen,
    view,
    setView,
    routeBody,
    weeklyBody,
    shellWrap,
    doLogout,
  }
}

function App() {
  const app = useBlueApp()
  const { screen, routeBody } = app

  useEffect(() => {
    document.title = 'BlueApp - Learn the World\'s Capitals'
  }, [])

  useEffect(() => {
    pingBackend()
    const interval = setInterval(() => {
      pingBackend()
    }, 4 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return <>{routeBody()}</>
}

export default App
