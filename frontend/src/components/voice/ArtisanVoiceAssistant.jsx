import { useEffect, useState } from 'react'
import {
  Check,
  CheckCircle2,
  Mic,
  RotateCcw,
  Sparkles,
  Volume2,
} from 'lucide-react'
import RobotAvatar from './RobotAvatar'
import VoiceWaveform from './VoiceWaveform'
import { useVoiceRegistration } from '../../hooks/useVoiceRegistration'

const LANGUAGES = [
  { code: 'pa', name: 'ਪੰਜਾਬੀ', label: 'Punjabi', flag: '🇮🇳' },
  { code: 'hi', name: 'हिंदी', label: 'Hindi', flag: '🇮🇳' },
  { code: 'en', name: 'English', label: 'English', flag: '🇬🇧' },
]

const ArtisanVoiceAssistant = ({ onRegistered, onSwitchToForm }) => {
  const {
    language,
    changeLanguage,
    questions,
    currentStepIndex,
    currentQuestion,
    answers,
    robotState,
    isMouthMoving,
    liveTranscript,
    lastSpokenText,
    feedbackMessage,
    summaryText,
    micError,
    isInitializing,
    startAssistant,
    startListening,
    replayCurrentQuestion,
    skipCurrentQuestion,
    confirmAndRegister,
  } = useVoiceRegistration({ onRegistered })

  const [hasStarted, setHasStarted] = useState(false)

  // Auto-start greeting on mount after questions load
  useEffect(() => {
    if (!isInitializing && questions.length > 0 && !hasStarted) {
      setHasStarted(true)
      startAssistant()
    }
  }, [isInitializing, questions, hasStarted, startAssistant])

  const isSummaryStep = currentStepIndex >= questions.length && questions.length > 0
  const isQuestionStep = currentStepIndex >= 0 && currentStepIndex < questions.length

  return (
    <div className="relative mx-auto w-full max-w-2xl rounded-3xl border border-border/80 bg-surface/95 p-5 shadow-2xl backdrop-blur-md sm:p-8">
      {/* 1. Header: Language Switcher & Form Fallback */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        {/* Language Pills */}
        <div className="flex items-center gap-1.5 rounded-full bg-surface-muted/90 p-1 border border-border">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                language === lang.code
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-main hover:bg-white/60'
              }`}
              onClick={() => changeLanguage(lang.code)}
              type="button"
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>

        {/* Switch to manual form link if preferred */}
        {onSwitchToForm && (
          <button
            className="text-xs font-semibold text-secondary hover:text-primary transition underline underline-offset-2"
            onClick={onSwitchToForm}
            type="button"
          >
            {language === 'pa'
              ? 'ਲਿਖ ਕੇ ਭਰੋ (Standard Form)'
              : language === 'hi'
                ? 'लिखकर भरें (Standard Form)'
                : 'Switch to Standard Form'}
          </button>
        )}
      </div>

      {/* 2. Step Progress Indicators (7 Questions) */}
      <div className="mt-5">
        <div className="flex items-center justify-between gap-1 mb-2 px-1">
          {questions.map((q, idx) => {
            const isCompleted = idx < currentStepIndex
            const isCurrent = idx === currentStepIndex
            return (
              <div
                key={q.id}
                className="flex flex-1 flex-col items-center group relative"
                title={q.prompts[language]?.display || q.prompts.en.display}
              >
                <div
                  className={`h-2.5 w-full rounded-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-500'
                      : isCurrent
                        ? 'bg-primary ring-2 ring-primary/30 animate-pulse'
                        : 'bg-gray-200'
                  }`}
                />
                <span className="mt-1 text-[0.65rem] font-bold text-text-muted hidden sm:inline">
                  {idx + 1}
                </span>
              </div>
            )
          })}
        </div>

        {/* Current Question Step Badge */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-0.5 text-xs font-semibold text-secondary">
            {isSummaryStep
              ? language === 'pa'
                ? 'ਪ੍ਰੋਫਾਈਲ ਸਮਰੀ (ਜਾਂਚ ਕਰੋ)'
                : language === 'hi'
                  ? 'प्रोफाइल सारांश (जांचें)'
                  : 'Profile Summary (Review)'
              : currentQuestion
                ? `${language === 'pa' ? 'ਸਵਾਲ' : language === 'hi' ? 'सवाल' : 'Question'} ${currentStepIndex + 1} / ${questions.length}`
                : language === 'pa'
                  ? 'ਸਵਾਗਤ ਹੈ'
                  : 'Welcome'}
          </span>
        </div>
      </div>

      {/* 3. Central AI Robot Avatar */}
      <div className="mt-4 flex flex-col items-center justify-center">
        <RobotAvatar
          className="my-1"
          isMouthMoving={isMouthMoving}
          language={language}
          state={robotState}
        />

        {/* Audio Waveform Visualizer */}
        <VoiceWaveform
          barCount={16}
          isActive={robotState === 'speaking' || robotState === 'listening'}
          state={robotState}
        />
      </div>

      {/* 4. Assistant Spoken Speech Card */}
      <div className="mt-2 text-center px-4 py-3 rounded-2xl bg-surface-muted/60 border border-border/60">
        <div className="flex items-center justify-center gap-2 text-primary font-semibold text-xs mb-1">
          <Volume2 className="h-4 w-4 animate-pulse" />
          <span>
            {language === 'pa'
              ? 'ਸਹਾਇਕ ਬੋਲ ਰਿਹਾ ਹੈ:'
              : language === 'hi'
                ? 'सहायक बोल रहा है:'
                : 'Assistant is asking:'}
          </span>
        </div>
        <p className="font-serif text-lg sm:text-xl font-bold text-text-main leading-relaxed">
          {lastSpokenText ||
            (currentQuestion?.prompts[language]?.spoken ||
              'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ ਤੁਹਾਡਾ ਸਕਿੱਲਬ੍ਰਿਜ ਸਹਾਇਕ ਹਾਂ।')}
        </p>

        {/* Replay Audio Button */}
        <button
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-text-secondary hover:text-primary hover:border-primary transition shadow-xs"
          onClick={replayCurrentQuestion}
          type="button"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>
            {language === 'pa'
              ? 'ਦੁਬਾਰਾ ਸੁਣੋ'
              : language === 'hi'
                ? 'दोबारा सुनें'
                : 'Listen again'}
          </span>
        </button>
      </div>

      {/* 5. User Speech / Feedback Card */}
      {(liveTranscript || feedbackMessage) && (
        <div className="mt-3 rounded-2xl border border-secondary/20 bg-secondary/5 p-3.5 text-center transition-all animate-fadeIn">
          {liveTranscript && (
            <div>
              <p className="text-xs font-semibold text-secondary">
                {language === 'pa'
                  ? 'ਤੁਸੀਂ ਕਿਹਾ (ਸੁਣਿਆ ਗਿਆ):'
                  : language === 'hi'
                    ? 'आपने कहा (सुना गया):'
                    : 'You said:'}
              </p>
              <p className="mt-0.5 text-base font-semibold text-text-main">
                "{liveTranscript}"
              </p>
            </div>
          )}
          {feedbackMessage && (
            <p className="mt-1 text-xs font-medium text-amber-700">
              {feedbackMessage}
            </p>
          )}
        </div>
      )}

      {/* 6. Mic Error Alert */}
      {micError && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 text-center">
          <p className="font-semibold">{micError}</p>
          <p className="mt-1 text-[0.7rem] text-red-600">
            {language === 'pa'
              ? 'ਕਿਰਪਾ ਕਰਕੇ ਬ੍ਰਾਉਜ਼ਰ ਸੈਟਿੰਗਜ਼ ਵਿੱਚ ਮਾਈਕ ਚਾਲੂ ਕਰੋ।'
              : 'Please enable microphone access in your browser settings.'}
          </p>
        </div>
      )}

      {/* 7. Summary Card (When All 7 Questions Are Done) */}
      {isSummaryStep && (
        <div className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4 text-left">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>
              {language === 'pa'
                ? 'ਤੁਹਾਡਾ ਕਾਰੀਗਰ ਪ੍ਰੋਫਾਈਲ ਵੇਰਵਾ:'
                : language === 'hi'
                  ? 'आपका कारीगर प्रोफाइल विवरण:'
                  : 'Your Artisan Profile Summary:'}
            </span>
          </div>

          {summaryText && (
            <p className="mb-3 text-xs sm:text-sm font-serif italic text-emerald-950 bg-emerald-100/60 p-2.5 rounded-lg border border-emerald-200">
              "{summaryText}"
            </p>
          )}

          <div className="grid gap-2 text-xs sm:text-sm text-text-main bg-white/80 p-3 rounded-xl border border-emerald-200">
            <div>
              <span className="font-semibold text-text-muted">
                {language === 'pa' ? 'ਨਾਂ (Name):' : 'Name:'}{' '}
              </span>
              <span className="font-bold text-text-main">{answers.name || '—'}</span>
            </div>
            <div>
              <span className="font-semibold text-text-muted">
                {language === 'pa' ? 'ਸਥਾਨ (Location):' : 'Location:'}{' '}
              </span>
              <span>{answers.location || '—'}</span>
            </div>
            <div>
              <span className="font-semibold text-text-muted">
                {language === 'pa' ? 'ਹੁਨਰ (Skills):' : 'Skills:'}{' '}
              </span>
              <span className="text-secondary font-semibold">
                {answers.skills || '—'}
              </span>
            </div>
            <div>
              <span className="font-semibold text-text-muted">
                {language === 'pa' ? 'ਤਜਰਬਾ (Experience):' : 'Experience:'}{' '}
              </span>
              <span>{answers.experience || '—'}</span>
            </div>
            <div>
              <span className="font-semibold text-text-muted">
                {language === 'pa' ? 'ਉਤਪਾਦ (Products):' : 'Products:'}{' '}
              </span>
              <span>{answers.products || '—'}</span>
            </div>
            <div>
              <span className="font-semibold text-text-muted">
                {language === 'pa' ? 'ਕੰਮ ਕਰਨ ਦਾ ਢੰਗ (Work Preference):' : 'Work Style:'}{' '}
              </span>
              <span>{answers.preference || '—'}</span>
            </div>
            {answers.phone && (
              <div>
                <span className="font-semibold text-text-muted">
                  {language === 'pa' ? 'ਸੰਪਰਕ ਨੰਬਰ (Contact):' : 'Contact:'}{' '}
                </span>
                <span>{answers.phone}</span>
              </div>
            )}
          </div>

          {/* Action Buttons for Summary */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              onClick={confirmAndRegister}
              type="button"
            >
              <Check className="h-5 w-5" />
              <span>
                {language === 'pa'
                  ? 'ਹਾਂ, ਸਭ ਸਹੀ ਹੈ (ਰਜਿਸਟਰ ਕਰੋ)'
                  : language === 'hi'
                    ? 'हाँ, सब सही है (रजिस्टर करें)'
                    : 'Yes, All Correct (Register Now)'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 8. Big Interactive Microphone Button & Quick Controls */}
      <div className="mt-6 flex flex-col items-center justify-center gap-3">
        <div className="relative flex items-center justify-center">
          {/* Pulsing ring when listening */}
          {robotState === 'listening' && (
            <span className="absolute h-24 w-24 rounded-full bg-emerald-500/20 animate-ping" />
          )}

          <button
            aria-label={
              robotState === 'listening'
                ? 'Listening to your speech'
                : 'Tap to speak to assistant'
            }
            className={`relative flex h-20 w-20 items-center justify-center rounded-full shadow-xl transition-all transform active:scale-95 focus-visible:outline-none focus-visible:ring-4 ${
              robotState === 'listening'
                ? 'bg-emerald-500 text-white ring-4 ring-emerald-300 animate-pulse'
                : robotState === 'speaking'
                  ? 'bg-primary text-white ring-4 ring-primary/30'
                  : 'bg-primary text-white hover:bg-primary-hover ring-4 ring-secondary/20'
            }`}
            onClick={() => {
              if (robotState === 'listening') {
                // Manually stop or process
              } else {
                startListening()
              }
            }}
            type="button"
          >
            {robotState === 'listening' ? (
              <Mic className="h-9 w-9 animate-bounce" />
            ) : robotState === 'speaking' ? (
              <Volume2 className="h-9 w-9 animate-pulse" />
            ) : (
              <Mic className="h-9 w-9" />
            )}
          </button>
        </div>

        {/* Clear Action Instruction */}
        <p className="text-xs font-semibold text-text-secondary">
          {robotState === 'listening'
            ? language === 'pa'
              ? 'ਹੁਣ ਬੋਲੋ ਜੀ... ਮੈਂ ਸੁਣ ਰਿਹਾ ਹਾਂ'
              : language === 'hi'
                ? 'अब बोलिए... मैं सुन रहा हूँ'
                : 'Listening... please speak now'
            : robotState === 'speaking'
              ? language === 'pa'
                ? 'ਸੁਣੋ ਜੀ...'
                : language === 'hi'
                  ? 'सुनिए जी...'
                  : 'Speaking...'
              : language === 'pa'
                ? 'ਜਵਾਬ ਦੇਣ ਲਈ ਮਾਈਕ ਬਟਨ ਦਬਾਓ'
                : language === 'hi'
                  ? 'उत्तर देने के लिए माइक बटन दबाएँ'
                  : 'Tap microphone to speak'}
        </p>

        {/* Skip Button for optional question (Q7) */}
        {isQuestionStep && currentQuestion?.id === 'Q7' && (
          <button
            className="text-xs text-text-muted hover:text-text-main underline"
            onClick={skipCurrentQuestion}
            type="button"
          >
            {language === 'pa' ? 'ਛੱਡੋ (Skip)' : 'Skip question'}
          </button>
        )}
      </div>

      {/* 9. Visual Footer with Reassurance */}
      <div className="mt-6 pt-4 border-t border-border/50 text-center">
        <p className="inline-flex items-center gap-1.5 text-xs text-text-muted">
          <Sparkles className="h-3.5 w-3.5 text-secondary" />
          <span>
            {language === 'pa'
              ? 'ਸਕਿੱਲਬ੍ਰਿਜ ਵਾਇਸ ਏ ਆਈ: ਪੇਂਡੂ ਭੈਣਾਂ ਲਈ ਖਾਸ ਬੋਲ ਕੇ ਰਜਿਸਟ੍ਰੇਸ਼ਨ'
              : language === 'hi'
                ? 'स्किलब्रिज वॉयस एआई: ग्रामीण महिलाओं के लिए विशेष बोलकर पंजीकरण'
                : 'SkillBridge Voice AI: Designed for rural women makers in India'}
          </span>
        </p>
      </div>
    </div>
  )
}

export default ArtisanVoiceAssistant
