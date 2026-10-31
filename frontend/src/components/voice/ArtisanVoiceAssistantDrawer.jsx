import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Mic,
  Package,
  RotateCcw,
  Send,
  ShoppingBag,
  Sparkles,
  Volume2,
  VolumeX,
  Wallet,
  X,
} from 'lucide-react'
import RobotAvatar from './RobotAvatar'
import VoiceWaveform from './VoiceWaveform'
import { sendVoiceAssistantMessageApi } from '../../services/voice-api'

const LANGUAGE_LOCALES = {
  pa: 'pa-IN',
  hi: 'hi-IN',
  en: 'en-IN',
}

const LANGUAGES = [
  { code: 'pa', name: 'ਪੰਜਾਬੀ', label: 'Punjabi', flag: '🇮🇳' },
  { code: 'hi', name: 'हिंदी', label: 'Hindi', flag: '🇮🇳' },
  { code: 'en', name: 'English', label: 'English', flag: '🇬🇧' },
]

const ArtisanVoiceAssistantDrawer = ({ isOpen, onClose, user }) => {
  const [language, setLanguage] = useState('pa')
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text:
        language === 'pa'
          ? `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ${user?.name || ''} ਜੀ! ਮੈਂ ਤੁਹਾਡਾ ਸਕਿੱਲਬ੍ਰਿਜ ਸਹਾਇਕ ਹਾਂ। ਤੁਸੀਂ ਮੈਨੂੰ ਆਵਾਜ਼ ਵਿੱਚ ਕਹਿ ਸਕਦੇ ਹੋ: 'ਮੇਰੇ ਉਤਪਾਦ ਦਿਖਾਓ', 'ਪੈਂਡਿੰਗ ਆਰਡਰ ਦਿਖਾਓ', 'ਕਮਾਈ ਚੈੱਕ ਕਰੋ', ਜਾਂ 'ਨਵਾਂ ਉਤਪਾਦ ਜੋੜੋ'!`
          : `नमस्ते ${user?.name || ''} जी! मैं आपका सहायक हूँ। आप बोल सकते हैं: 'मेरे उत्पाद दिखाओ', 'पेंडिंग ऑर्डर बताओ', 'कमाई चेक करो', या 'नया उत्पाद जोड़ो'।`,
      speechText: `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ${user?.name || ''} ਜੀ! ਮੈਂ ਤੁਹਾਡਾ ਸਕਿੱਲਬ੍ਰਿਜ ਸਹਾਇਕ ਹਾਂ। ਤੁਸੀਂ ਮੈਨੂੰ ਉਤਪਾਦ ਜੋੜਨ, ਆਰਡਰ ਦੇਖਣ ਜਾਂ ਕਮਾਈ ਚੈੱਕ ਕਰਨ ਲਈ ਕਹਿ ਸਕਦੇ ਹੋ।`,
      actionData: null,
    },
  ])

  const [inputMessage, setInputMessage] = useState('')
  const [liveTranscript, setLiveTranscript] = useState('')
  const [robotState, setRobotState] = useState('idle') // 'idle' | 'speaking' | 'listening' | 'processing' | 'success'
  const [isMouthMoving, setIsMouthMoving] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [lastSpokenText, setLastSpokenText] = useState('')
  const [micError, setMicError] = useState('')
  const [isMuted, setIsMuted] = useState(false)

  const chatBottomRef = useRef(null)
  const recognitionRef = useRef(null)
  const isListeningRef = useRef(false)
  const isSpeakingRef = useRef(false)

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, liveTranscript, pendingAction])

  // Stop all audio & recognition
  const stopAudio = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    isSpeakingRef.current = false
    setIsMouthMoving(false)
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        /* ignore */
      }
      isListeningRef.current = false
    }
    if (robotState === 'speaking' || robotState === 'listening') {
      setRobotState('idle')
    }
  }, [robotState])

  // Clean text and speak via SpeechSynthesis
  const speakResponse = useCallback(
    (text, onComplete) => {
      if (isMuted || !text || typeof window === 'undefined' || !window.speechSynthesis) {
        if (onComplete) onComplete()
        return
      }

      stopAudio()
      setRobotState('speaking')
      setIsMouthMoving(true)
      isSpeakingRef.current = true
      setLastSpokenText(text)

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = LANGUAGE_LOCALES[language] || 'pa-IN'
      utterance.rate = 0.95
      utterance.pitch = 1.05

      // Select regional voice
      const voices = window.speechSynthesis.getVoices()
      const langPrefix = language === 'pa' ? 'pa' : language === 'hi' ? 'hi' : 'en'
      const matched = voices.find(
        (v) =>
          v.lang &&
          (v.lang.toLowerCase().startsWith(langPrefix) ||
            v.lang.toLowerCase().includes('in'))
      )
      if (matched) utterance.voice = matched

      utterance.onstart = () => {
        setIsMouthMoving(true)
        setRobotState('speaking')
      }

      utterance.onboundary = () => {
        setIsMouthMoving((prev) => !prev)
        setTimeout(() => setIsMouthMoving(true), 60)
      }

      utterance.onend = () => {
        isSpeakingRef.current = false
        setIsMouthMoving(false)
        setRobotState('idle')
        if (onComplete) onComplete()
      }

      utterance.onerror = () => {
        isSpeakingRef.current = false
        setIsMouthMoving(false)
        setRobotState('idle')
        if (onComplete) onComplete()
      }

      // Safety timeout
      const duration = Math.max(3000, text.length * 90)
      setTimeout(() => {
        if (isSpeakingRef.current) {
          isSpeakingRef.current = false
          setIsMouthMoving(false)
          setRobotState('idle')
        }
      }, duration + 2000)

      window.speechSynthesis.speak(utterance)
    },
    [isMuted, language, stopAudio]
  )

  // Send message to backend assistant
  const handleSendMessage = useCallback(
    async (textToSend) => {
      const msg = (textToSend || inputMessage).trim()
      if (!msg) return

      stopAudio()
      setInputMessage('')
      setLiveTranscript('')
      setRobotState('processing')

      // Add user message to UI
      const userMsgObj = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: msg,
      }
      setMessages((prev) => [...prev, userMsgObj])

      try {
        const historyPayload = messages.slice(-6).map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }))

        const res = await sendVoiceAssistantMessageApi({
          message: msg,
          conversationHistory: historyPayload,
          pendingAction,
          language,
        })

        if (!res?.success) {
          throw new Error(res?.message || 'Assistant request failed')
        }

        const assistantMsgObj = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: res.reply,
          speechText: res.speechText || res.reply,
          actionData: res.actionData || null,
        }

        setMessages((prev) => [...prev, assistantMsgObj])
        setPendingAction(res.pendingAction || null)

        // Speak the reply out loud
        speakResponse(res.speechText || res.reply)
      } catch (err) {
        console.error('Assistant error:', err)
        const errMsg =
          language === 'pa'
            ? 'ਮਾਫ਼ ਕਰਨਾ, ਕੋਈ ਤਕਨੀਕੀ ਖਰਾਬੀ ਆਈ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।'
            : 'Sorry, something went wrong. Please try again.'

        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'assistant',
            text: errMsg,
            isError: true,
          },
        ])
        setRobotState('idle')
        speakResponse(errMsg)
      }
    },
    [inputMessage, messages, pendingAction, language, stopAudio, speakResponse]
  )

  // Start Speech-to-Text Recognition
  const startListening = useCallback(() => {
    stopAudio()
    setMicError('')
    setLiveTranscript('')

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setMicError(
        language === 'pa'
          ? 'ਬ੍ਰਾਉਜ਼ਰ ਸਪੀਚ ਰਿਕੋਗਨੀਸ਼ਨ ਦਾ ਸਮਰਥਨ ਨਹੀਂ ਕਰਦਾ। ਕਿਰਪਾ ਕਰਕੇ Google Chrome ਵਰਤੋ।'
          : 'Your browser does not support Speech Recognition. Please use Chrome.'
      )
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      recognition.lang = LANGUAGE_LOCALES[language] || 'pa-IN'
      recognition.continuous = false
      recognition.interimResults = true

      recognition.onstart = () => {
        isListeningRef.current = true
        setRobotState('listening')
      }

      recognition.onresult = (event) => {
        let interim = ''
        let final = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            final += transcript
          } else {
            interim += transcript
          }
        }

        const currentText = (final || interim).trim()
        setLiveTranscript(currentText)

        if (final.trim()) {
          recognition.stop()
          handleSendMessage(final.trim())
        }
      }

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error)
        isListeningRef.current = false
        if (event.error === 'not-allowed') {
          setMicError(
            language === 'pa'
              ? 'ਕਿਰਪਾ ਕਰਕੇ ਮਾਈਕ੍ਰੋਫੋਨ ਦੀ ਇਜਾਜ਼ਤ ਦਿਓ ਜੀ।'
              : 'Please allow microphone access.'
          )
        }
        setRobotState('idle')
      }

      recognition.onend = () => {
        isListeningRef.current = false
        if (robotState === 'listening') {
          setRobotState('idle')
        }
      }

      recognition.start()
    } catch (err) {
      console.error('Failed to start speech recognition:', err)
      setMicError(err.message)
      setRobotState('idle')
    }
  }, [language, robotState, stopAudio, handleSendMessage])

  if (!isOpen) return null

  return (
    <div
      aria-label="SkillBridge Artisan Voice Assistant"
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
      role="dialog"
    >
      <div className="relative flex h-full w-full max-w-lg flex-col bg-surface shadow-2xl border-l border-border transition-transform duration-300 sm:max-w-md md:max-w-lg">
        {/* 1. Header */}
        <div className="flex items-center justify-between border-b border-border/80 bg-surface-muted/60 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
              <Bot className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-serif text-base font-bold text-text-main flex items-center gap-1.5">
                <span>SkillBridge AI Assistant</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </h2>
              <p className="text-[0.68rem] text-secondary font-semibold uppercase tracking-wider">
                Voice Operated Artisan Workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 rounded-full bg-surface border border-border p-0.5">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold transition-all ${
                    language === l.code
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-main'
                  }`}
                  onClick={() => {
                    stopAudio()
                    setLanguage(l.code)
                  }}
                  type="button"
                >
                  {l.name}
                </button>
              ))}
            </div>

            {/* Mute Toggle */}
            <button
              aria-label={isMuted ? 'Unmute voice' : 'Mute voice'}
              className="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-text-main transition"
              onClick={() => {
                if (!isMuted) stopAudio()
                setIsMuted(!isMuted)
              }}
              type="button"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            {/* Close Button */}
            <button
              aria-label="Close assistant"
              className="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-text-main transition"
              onClick={() => {
                stopAudio()
                onClose()
              }}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 2. Central Mini Robot Stage */}
        <div className="flex flex-col items-center justify-center border-b border-border/50 bg-gradient-to-b from-surface-muted/30 to-surface py-2.5 px-4">
          <RobotAvatar
            className="scale-85 -my-2"
            isMouthMoving={isMouthMoving}
            language={language}
            state={robotState}
          />
          <VoiceWaveform
            barCount={14}
            isActive={robotState === 'speaking' || robotState === 'listening'}
            state={robotState}
          />
        </div>

        {/* 3. Conversation Message History */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 sm:px-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-primary text-white rounded-br-xs'
                    : msg.isError
                    ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-xs'
                    : 'bg-surface-muted text-text-main border border-border/80 rounded-bl-xs'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>

              {/* Action Data Visual Cards (Products, Orders, Earnings) */}
              {msg.actionData && (
                <div className="mt-2 w-full max-w-[95%] space-y-2">
                  {/* Products Card List */}
                  {msg.actionData.products && msg.actionData.products.length > 0 && (
                    <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-3 space-y-2">
                      <p className="text-xs font-bold text-secondary flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" />
                        <span>Listed Products ({msg.actionData.products.length})</span>
                      </p>
                      <div className="grid gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {msg.actionData.products.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between rounded-lg bg-white p-2 text-xs border border-border shadow-2xs"
                          >
                            <span className="font-semibold text-text-main truncate max-w-[150px]">
                              {p.title}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-secondary">₹{p.price}</span>
                              <span className="text-[0.65rem] text-text-muted">Stock: {p.stock}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Orders Card List */}
                  {msg.actionData.orders && msg.actionData.orders.length > 0 && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-3 space-y-2">
                      <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Orders List ({msg.actionData.orders.length})</span>
                      </p>
                      <div className="grid gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {msg.actionData.orders.map((o) => (
                          <div
                            key={o.id}
                            className="flex items-center justify-between rounded-lg bg-white p-2.5 text-xs border border-amber-200 shadow-2xs"
                          >
                            <div>
                              <p className="font-bold text-text-main">
                                #{o.orderNumber || o.id.slice(-6)}
                              </p>
                              <p className="text-[0.68rem] text-text-muted truncate max-w-[140px]">
                                {o.items?.[0]?.title} • {o.customer?.fullName || 'Customer'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-primary">₹{o.subtotal}</span>
                              <span
                                className={`block text-[0.65rem] font-bold ${
                                  o.status === 'Completed'
                                    ? 'text-emerald-600'
                                    : 'text-amber-600'
                                }`}
                              >
                                {o.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Earnings Summary Card */}
                  {msg.actionData.totalEarned !== undefined && (
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-emerald-300 bg-emerald-50/70 p-3 text-xs">
                      <div>
                        <span className="text-[0.65rem] font-semibold text-emerald-800">
                          Total Verified Earnings
                        </span>
                        <p className="text-base font-bold text-emerald-700">
                          ₹{msg.actionData.totalEarned.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <span className="text-[0.65rem] font-semibold text-amber-800">
                          Pending Payouts
                        </span>
                        <p className="text-base font-bold text-amber-700">
                          ₹{(msg.actionData.pendingPayout || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Pending Action Confirmation Banner */}
          {pendingAction && (
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 shadow-sm animate-fadeIn">
              <p className="text-xs font-bold text-primary flex items-center gap-1.5 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span>ਕਿਰਪਾ ਕਰਕੇ ਪੁਸ਼ਟੀ ਕਰੋ / Please Confirm:</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                  onClick={() => handleSendMessage('yes')}
                  type="button"
                >
                  <Check className="h-4 w-4" />
                  <span>ਹਾਂ, ਪੁਸ਼ਟੀ ਕਰੋ (Yes)</span>
                </button>
                <button
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-xs font-bold text-text-secondary hover:bg-surface-muted transition"
                  onClick={() => handleSendMessage('no')}
                  type="button"
                >
                  <X className="h-4 w-4" />
                  <span>ਰੱਦ ਕਰੋ (Cancel)</span>
                </button>
              </div>
            </div>
          )}

          {/* Real-time Voice Transcription bubble */}
          {liveTranscript && (
            <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-2.5 text-center text-xs font-semibold text-text-main animate-pulse">
              <span className="text-[0.68rem] text-secondary block font-bold">
                {language === 'pa' ? 'ਸੁਣ ਰਿਹਾ ਹਾਂ...' : 'Hearing:'}
              </span>
              "{liveTranscript}"
            </div>
          )}

          {/* Mic error warning */}
          {micError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-center text-xs text-red-700">
              {micError}
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* 4. Footer Interactive Controls */}
        <div className="border-t border-border/80 bg-surface p-3 sm:p-4 space-y-2">
          {/* Quick Voice Controls: Big Mic Button & Replay */}
          <div className="flex items-center justify-center gap-4">
            {/* Replay last audio button */}
            <button
              aria-label="Replay last assistant speech"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-muted text-text-secondary hover:text-primary hover:border-primary transition"
              onClick={() => {
                if (lastSpokenText) speakResponse(lastSpokenText)
              }}
              title="Replay voice"
              type="button"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Huge Microphone Button */}
            <div className="relative flex items-center justify-center">
              {robotState === 'listening' && (
                <span className="absolute h-18 w-18 rounded-full bg-emerald-500/25 animate-ping" />
              )}
              <button
                aria-label={robotState === 'listening' ? 'Listening...' : 'Tap to speak'}
                className={`relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all transform active:scale-95 ${
                  robotState === 'listening'
                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-300 animate-pulse'
                    : robotState === 'speaking'
                    ? 'bg-primary text-white ring-4 ring-primary/30'
                    : 'bg-primary text-white hover:bg-primary-hover ring-4 ring-secondary/20'
                }`}
                onClick={() => {
                  if (robotState === 'listening') {
                    stopAudio()
                  } else {
                    startListening()
                  }
                }}
                type="button"
              >
                {robotState === 'listening' ? (
                  <Mic className="h-7 w-7 animate-bounce" />
                ) : robotState === 'speaking' ? (
                  <Volume2 className="h-7 w-7 animate-pulse" />
                ) : (
                  <Mic className="h-7 w-7" />
                )}
              </button>
            </div>

            {/* Stop audio button */}
            <button
              aria-label="Stop audio"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-muted text-text-secondary hover:text-error hover:border-error transition"
              onClick={stopAudio}
              title="Stop listening/speaking"
              type="button"
            >
              <VolumeX className="h-4 w-4" />
            </button>
          </div>

          <p className="text-center text-[0.68rem] font-semibold text-text-muted">
            {robotState === 'listening'
              ? language === 'pa'
                ? 'ਬੋਲੋ ਜੀ... ਮੈਂ ਸੁਣ ਰਿਹਾ ਹਾਂ'
                : 'Listening... please speak now'
              : language === 'pa'
              ? 'ਬੋਲਣ ਲਈ ਮਾਈਕ ਦਬਾਓ ਜਾਂ ਹੇਠਾਂ ਲਿਖੋ'
              : 'Tap microphone to speak or type below'}
          </p>

          {/* Text Input Fallback Bar */}
          <form
            className="flex items-center gap-2 pt-1"
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage(inputMessage)
            }}
          >
            <input
              className="flex-1 rounded-xl border border-border bg-surface-muted/60 px-3.5 py-2 text-xs text-text-main outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary transition placeholder:text-text-muted"
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                language === 'pa'
                  ? "ਕੁਝ ਵੀ ਪੁੱਛੋ ਜਾਂ ਲਿਖੋ (ਜਿਵੇਂ 'ਨਵਾਂ ਉਤਪਾਦ ਜੋੜੋ')..."
                  : "Type a command or question..."
              }
              value={inputMessage}
            />
            <button
              aria-label="Send message"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-hover transition disabled:opacity-50"
              disabled={!inputMessage.trim()}
              type="submit"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ArtisanVoiceAssistantDrawer
