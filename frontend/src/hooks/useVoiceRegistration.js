import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getVoiceQuestionsApi,
  getVoiceSummaryApi,
  processVoiceAnswerApi,
  registerArtisanVoiceApi,
} from '../services/voice-api'

const LANGUAGE_LOCALES = {
  pa: 'pa-IN',
  hi: 'hi-IN',
  en: 'en-IN',
}

export function useVoiceRegistration({ onRegistered } = {}) {
  const [language, setLanguage] = useState('pa') // Punjabi default
  const [questions, setQuestions] = useState([])
  const [systemMessages, setSystemMessages] = useState({})
  const [currentStepIndex, setCurrentStepIndex] = useState(-1) // -1 is Greeting
  const [answers, setAnswers] = useState({
    name: '',
    location: '',
    skills: '',
    experience: '',
    products: '',
    preference: '',
    phone: '',
  })

  // State machine: 'idle' | 'speaking' | 'listening' | 'processing' | 'summary' | 'registering' | 'completed' | 'error'
  const [robotState, setRobotState] = useState('idle')
  const [isMouthMoving, setIsMouthMoving] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [lastSpokenText, setLastSpokenText] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [summaryText, setSummaryText] = useState('')
  const [micError, setMicError] = useState('')
  const [isInitializing, setIsInitializing] = useState(true)

  const recognitionRef = useRef(null)
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null)
  const isSpeakingRef = useRef(false)
  const isListeningRef = useRef(false)
  const answersRef = useRef(answers)
  const currentStepRef = useRef(currentStepIndex)
  const questionsRef = useRef(questions)
  const languageRef = useRef(language)

  // Keep refs up to date
  useEffect(() => {
    answersRef.current = answers
  }, [answers])
  useEffect(() => {
    currentStepRef.current = currentStepIndex
  }, [currentStepIndex])
  useEffect(() => {
    questionsRef.current = questions
  }, [questions])
  useEffect(() => {
    languageRef.current = language
  }, [language])

  // Stop any ongoing speech or recognition
  const stopAllAudio = useCallback(() => {
    if (synthRef.current && synthRef.current.speaking) {
      synthRef.current.cancel()
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
  }, [])

  // Text-to-Speech speaking function with mouth movement synchronization
  const speakText = useCallback(
    (text, onComplete) => {
      stopAllAudio()
      if (!text || typeof window === 'undefined' || !window.speechSynthesis) {
        if (onComplete) onComplete()
        return
      }

      setLastSpokenText(text)
      setRobotState('speaking')
      setIsMouthMoving(true)
      isSpeakingRef.current = true

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = LANGUAGE_LOCALES[languageRef.current] || 'pa-IN'
      utterance.rate = 0.95 // Clear and friendly pace for rural users
      utterance.pitch = 1.05

      // Select regional voice if available
      const voices = window.speechSynthesis.getVoices()
      const langPrefix = languageRef.current === 'pa' ? 'pa' : languageRef.current === 'hi' ? 'hi' : 'en'
      const matchedVoice = voices.find(
        (v) =>
          v.lang &&
          (v.lang.toLowerCase().startsWith(langPrefix) ||
            v.lang.toLowerCase().includes('in'))
      )
      if (matchedVoice) {
        utterance.voice = matchedVoice
      }

      utterance.onstart = () => {
        setIsMouthMoving(true)
        setRobotState('speaking')
      }

      utterance.onboundary = () => {
        // Toggle mouth movement frame
        setIsMouthMoving((prev) => !prev)
        setTimeout(() => setIsMouthMoving(true), 60)
      }

      utterance.onend = () => {
        isSpeakingRef.current = false
        setIsMouthMoving(false)
        if (onComplete) {
          onComplete()
        }
      }

      utterance.onerror = () => {
        isSpeakingRef.current = false
        setIsMouthMoving(false)
        if (onComplete) {
          onComplete()
        }
      }

      // Safety timeout in case speechSynthesis hangs (browser quirk)
      const estimatedDuration = Math.max(3000, text.length * 100)
      const timeoutId = setTimeout(() => {
        if (isSpeakingRef.current) {
          isSpeakingRef.current = false
          setIsMouthMoving(false)
          if (onComplete) onComplete()
        }
      }, estimatedDuration + 2000)

      window.speechSynthesis.speak(utterance)
      return () => clearTimeout(timeoutId)
    },
    [stopAllAudio]
  )

  // Start Speech-to-Text Listening
  const startListening = useCallback(
    (customOnResult) => {
      stopAllAudio()
      setMicError('')
      setLiveTranscript('')

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition

      if (!SpeechRecognition) {
        setMicError(
          languageRef.current === 'pa'
            ? 'ਤੁਹਾਡਾ ਬ੍ਰਾਉਜ਼ਰ ਸਪੀਚ ਰਿਕੋਗਨੀਸ਼ਨ ਦਾ ਸਮਰਥਨ ਨਹੀਂ ਕਰਦਾ। ਕਿਰਪਾ ਕਰਕੇ ਕਰੋਮ (Chrome) ਦੀ ਵਰਤੋਂ ਕਰੋ।'
            : languageRef.current === 'hi'
              ? 'आपका ब्राउज़र स्पीच रिकग्निशन का समर्थन नहीं करता। कृपया Chrome उपयोग करें।'
              : 'Your browser does not support Speech Recognition. Please use Google Chrome.'
        )
        setRobotState('idle')
        return
      }

      try {
        const recognition = new SpeechRecognition()
        recognitionRef.current = recognition
        recognition.lang = LANGUAGE_LOCALES[languageRef.current] || 'pa-IN'
        recognition.continuous = false
        recognition.interimResults = true
        recognition.maxAlternatives = 1

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
            if (customOnResult) {
              customOnResult(final.trim())
            } else {
              // Standard step handler
              handleTranscriptReceived(final.trim())
            }
          }
        }

        recognition.onerror = (event) => {
          console.warn('Speech recognition error:', event.error)
          isListeningRef.current = false
          if (event.error === 'not-allowed') {
            setMicError(
              languageRef.current === 'pa'
                ? 'ਕਿਰਪਾ ਕਰਕੇ ਮਾਈਕ੍ਰੋਫੋਨ ਦੀ ਇਜਾਜ਼ਤ (Mic Permission) ਦਿਓ ਜੀ।'
                : languageRef.current === 'hi'
                  ? 'कृपया माइक्रोफ़ोन की अनुमति (Mic Permission) दें जी।'
                  : 'Please allow microphone access to speak to the assistant.'
            )
          }
          setRobotState('idle')
        }

        recognition.onend = () => {
          isListeningRef.current = false
          // If we stopped listening without receiving final transcript, switch back to idle
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stopAllAudio]
  )

  // Handle incoming final transcript
  const handleTranscriptReceived = useCallback(
    async (transcript) => {
      const stepIdx = currentStepRef.current
      const qList = questionsRef.current
      const currentLang = languageRef.current

      if (!transcript || transcript.length < 1) {
        setRobotState('idle')
        return
      }

      // If we are in summary confirmation step
      if (stepIdx >= qList.length) {
        handleConfirmationTranscript(transcript)
        return
      }

      const activeQuestion = qList[stepIdx]
      if (!activeQuestion) return

      setRobotState('processing')
      setFeedbackMessage(
        currentLang === 'pa'
          ? 'ਤੁਹਾਡਾ ਜਵਾਬ ਸਮਝ ਰਿਹਾ ਹਾਂ...'
          : currentLang === 'hi'
            ? 'आपका जवाब समझ रहा हूँ...'
            : 'Understanding your answer...'
      )

      try {
        const response = await processVoiceAnswerApi({
          question_id: activeQuestion.id,
          transcript,
          language: currentLang,
          current_answers: answersRef.current,
        })

        if (!response?.success) {
          throw new Error(response?.message || 'Processing failed')
        }

        const { extraction, next_question_id, is_complete, guidance_message } =
          response

        // If extraction is valid and clear
        if (extraction.is_valid && !extraction.needs_clarification) {
          // Update answer for this question
          const val = extraction.extracted_value
          const newAnswers = {
            ...answersRef.current,
            [activeQuestion.key]: Array.isArray(val) ? val.join(', ') : val,
          }

          // If LLM also extracted secondary fields, merge them gracefully
          if (
            extraction.secondary_extractions &&
            typeof extraction.secondary_extractions === 'object'
          ) {
            for (const [secQId, secVal] of Object.entries(
              extraction.secondary_extractions
            )) {
              const matchedQ = qList.find((q) => q.id === secQId)
              if (matchedQ && secVal && !newAnswers[matchedQ.key]) {
                newAnswers[matchedQ.key] = Array.isArray(secVal)
                  ? secVal.join(', ')
                  : String(secVal)
              }
            }
          }

          setAnswers(newAnswers)
          answersRef.current = newAnswers

          // Advance to next question or summary
          if (is_complete || !next_question_id) {
            // Move to summary
            goToSummary(newAnswers)
          } else {
            const nextIdx = qList.findIndex((q) => q.id === next_question_id)
            if (nextIdx !== -1) {
              setCurrentStepIndex(nextIdx)
              currentStepRef.current = nextIdx
              playQuestion(nextIdx)
            } else {
              goToSummary(newAnswers)
            }
          }
        } else {
          // Unclear or unrelated answer - politely repeat/clarify
          const promptToSpeak =
            guidance_message ||
            activeQuestion.prompts[currentLang]?.spoken ||
            activeQuestion.prompts.en.spoken

          setFeedbackMessage(promptToSpeak)
          speakText(promptToSpeak, () => {
            startListening()
          })
        }
      } catch (err) {
        console.error('Error in answer processing:', err)
        setRobotState('idle')
        setFeedbackMessage('ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਬੋਲੋ ਜੀ / Please try speaking again.')
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [speakText, startListening]
  )

  // Handle confirmation transcript when summary is read out
  const handleConfirmationTranscript = useCallback(
    async (transcript) => {
      const lower = transcript.toLowerCase()
      const isAffirmative =
        lower.includes('haan') ||
        lower.includes('hanji') ||
        lower.includes('sahi') ||
        lower.includes('theek') ||
        lower.includes('yes') ||
        lower.includes('correct') ||
        lower.includes('confirm') ||
        lower.includes('okay') ||
        transcript.includes('ਹਾਂ') ||
        transcript.includes('ਸਹੀ') ||
        transcript.includes('ਠੀਕ') ||
        transcript.includes('हाँ') ||
        transcript.includes('सही') ||
        transcript.includes('ठीक')

      if (isAffirmative) {
        completeRegistration()
      } else {
        const notUnderstoodMsg =
          languageRef.current === 'pa'
            ? 'ਜੇਕਰ ਜਾਣਕਾਰੀ ਸਹੀ ਹੈ ਤਾਂ ਕਹੋ "ਹਾਂ ਜੀ" ਜਾਂ ਬਟਨ ਦਬਾਓ।'
            : languageRef.current === 'hi'
              ? 'यदि जानकारी सही है तो बोलिए "हाँ जी" या बटन दबाएँ।'
              : 'If your details are correct, say "Yes" or tap Confirm.'
        speakText(notUnderstoodMsg, () => {
          startListening()
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [speakText, startListening]
  )

  // Transition to Summary Step
  const goToSummary = useCallback(
    async (collectedAnswers) => {
      const currentLang = languageRef.current
      setCurrentStepIndex(questionsRef.current.length) // summary index
      currentStepRef.current = questionsRef.current.length
      setRobotState('processing')

      try {
        const summaryRes = await getVoiceSummaryApi({
          answers: collectedAnswers || answersRef.current,
          language: currentLang,
        })

        const text = summaryRes?.summary_text || ''
        const confirmPrompt = summaryRes?.confirmation_prompt || ''
        setSummaryText(text)

        const fullSpeech = `${text} ${confirmPrompt}`
        speakText(fullSpeech, () => {
          startListening()
        })
      } catch (err) {
        console.error('Failed to get summary:', err)
        completeRegistration()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [speakText, startListening]
  )

  // Complete registration and authenticate
  const completeRegistration = useCallback(async () => {
    stopAllAudio()
    setRobotState('processing')
    const currentLang = languageRef.current

    try {
      const result = await registerArtisanVoiceApi({
        answers: answersRef.current,
        language: currentLang,
      })

      if (result?.success) {
        setRobotState('success')
        const successSpeech =
          result.message ||
          (currentLang === 'pa'
            ? 'ਮੁਬਾਰਕਾਂ! ਤੁਹਾਡਾ ਖਾਤਾ ਬਣ ਗਿਆ ਹੈ।'
            : 'Congratulations! Your account is created.')

        speakText(successSpeech, () => {
          if (onRegistered && result.user) {
            onRegistered(result.user)
          }
        })
      } else {
        throw new Error(result?.message || 'Registration failed')
      }
    } catch (err) {
      console.error('Voice registration failed:', err)
      setRobotState('error')
      setFeedbackMessage(err.message || 'Registration failed. Please try again.')
    }
  }, [stopAllAudio, speakText, onRegistered])

  // Play question at index
  const playQuestion = useCallback(
    (index) => {
      const qList = questionsRef.current
      const currentLang = languageRef.current
      const question = qList[index]
      if (!question) return

      setCurrentStepIndex(index)
      currentStepRef.current = index
      setLiveTranscript('')
      setFeedbackMessage('')

      const spokenText =
        question.prompts[currentLang]?.spoken || question.prompts.en.spoken

      speakText(spokenText, () => {
        // Automatically start listening after question is spoken
        startListening()
      })
    },
    [speakText, startListening]
  )

  // Start Assistant from Greeting
  const startAssistant = useCallback(() => {
    stopAllAudio()
    setCurrentStepIndex(-1)
    currentStepRef.current = -1

    const currentLang = languageRef.current
    const greeting =
      systemMessages?.greeting?.[currentLang] ||
      (currentLang === 'pa'
        ? 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ ਤੁਹਾਡਾ ਸਕਿੱਲਬ੍ਰਿਜ ਸਹਾਇਕ ਹਾਂ।'
        : 'Welcome to SkillBridge!')

    speakText(greeting, () => {
      // Advance to Q1
      if (questionsRef.current.length > 0) {
        playQuestion(0)
      }
    })
  }, [stopAllAudio, systemMessages, speakText, playQuestion])

  // Change language and reset/replay
  const changeLanguage = useCallback(
    (newLang) => {
      stopAllAudio()
      setLanguage(newLang)
      languageRef.current = newLang

      // If at greeting or mid-questions, replay current step in new language
      const stepIdx = currentStepRef.current
      if (stepIdx === -1) {
        // Replay greeting
        const greeting =
          systemMessages?.greeting?.[newLang] ||
          (newLang === 'pa'
            ? 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ ਤੁਹਾਡਾ ਸਕਿੱਲਬ੍ਰਿਜ ਸਹਾਇਕ ਹਾਂ।'
            : 'Welcome to SkillBridge!')
        speakText(greeting, () => {
          if (questionsRef.current.length > 0) playQuestion(0)
        })
      } else if (stepIdx < questionsRef.current.length) {
        playQuestion(stepIdx)
      } else {
        // At summary
        goToSummary(answersRef.current)
      }
    },
    [stopAllAudio, systemMessages, speakText, playQuestion, goToSummary]
  )

  // Initialize questions on mount
  useEffect(() => {
    let mounted = true
    async function loadQuestions() {
      try {
        const res = await getVoiceQuestionsApi(language)
        if (mounted && res?.success) {
          setQuestions(res.questions || [])
          setSystemMessages(res.messages || {})
          setIsInitializing(false)
        }
      } catch (err) {
        console.error('Failed to load voice questions:', err)
        if (mounted) setIsInitializing(false)
      }
    }
    loadQuestions()
    return () => {
      mounted = false
      stopAllAudio()
    }
  }, [language, stopAllAudio])

  return {
    language,
    changeLanguage,
    questions,
    currentStepIndex,
    currentQuestion: questions[currentStepIndex] || null,
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
    stopAllAudio,
    replayCurrentQuestion: () => {
      if (currentStepIndex >= 0 && currentStepIndex < questions.length) {
        playQuestion(currentStepIndex)
      } else if (currentStepIndex >= questions.length) {
        goToSummary(answers)
      } else {
        startAssistant()
      }
    },
    skipCurrentQuestion: () => {
      const stepIdx = currentStepIndex
      if (stepIdx >= 0 && stepIdx < questions.length) {
        if (stepIdx < questions.length - 1) {
          playQuestion(stepIdx + 1)
        } else {
          goToSummary(answers)
        }
      }
    },
    confirmAndRegister: completeRegistration,
    setManualAnswer: (key, value) => {
      setAnswers((prev) => ({ ...prev, [key]: value }))
    },
  }
}

