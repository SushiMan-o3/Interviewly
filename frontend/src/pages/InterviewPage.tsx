import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WS_URL } from '../api/client'
import { getInterview } from '../api/interviews'
import { useAuth } from '../context/AuthContext'
import type { Interview } from '../types'

interface TranscriptEntry {
  id: number
  from: 'system' | 'me'
  text: string
}

type SessionStatus = 'idle' | 'connecting' | 'active' | 'ended'
// 'ready' = your turn to record, 'recording' = mic capturing, 'waiting' = sent, waiting on the backend's reply
type TurnStatus = 'ready' | 'recording' | 'waiting'

export default function InterviewPage() {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()

  const [interview, setInterview] = useState<Interview | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [cameraError, setCameraError] = useState<string | null>(null)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle')
  const [turnStatus, setTurnStatus] = useState<TurnStatus>('ready')
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const entryIdRef = useRef(0)

  const appendTranscript = useCallback((from: TranscriptEntry['from'], text: string) => {
    entryIdRef.current += 1
    setTranscript((prev) => [...prev, { id: entryIdRef.current, from, text }])
  }, [])

  // Load interview details
  useEffect(() => {
    if (!id) return
    getInterview(Number(id))
      .then(setInterview)
      .catch((err) => {
        console.error(err)
        setLoadError('Could not load this interview.')
      })
  }, [id])

  // Camera self-preview (video only shown to the user, not sent anywhere)
  useEffect(() => {
    let cancelled = false

    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      })
      .catch((err) => {
        console.error(err)
        setCameraError('Could not access camera/microphone.')
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  // Always close the socket and stop any in-flight recording on unmount
  useEffect(() => {
    return () => {
      recorderRef.current?.stop()
      wsRef.current?.close()
    }
  }, [])

  const handleStartInterview = () => {
    if (!id || !token || sessionStatus !== 'idle') return

    setSessionStatus('connecting')
    const socket = new WebSocket(`${WS_URL}/interviews/interview_session/${id}?token=${token}`)
    wsRef.current = socket

    socket.onopen = () => {
      setSessionStatus('active')
      setTurnStatus('ready')
    }

    socket.onclose = () => {
      setSessionStatus('ended')
      setTurnStatus('ready')
    }

    socket.onerror = (err) => console.error('WebSocket error', err)

    // Every reply from the backend closes out the current turn and opens the next one.
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        appendTranscript('system', data.message ?? event.data)
      } catch {
        appendTranscript('system', event.data)
      }
      setTurnStatus('ready')
    }
  }

  const handleEndInterview = () => {
    recorderRef.current?.stop()
    wsRef.current?.close()
    wsRef.current = null
    setSessionStatus('ended')
    setTurnStatus('ready')
  }

  const handleToggleRecording = () => {
    const stream = streamRef.current
    const socket = wsRef.current
    if (!stream || !socket || socket.readyState !== WebSocket.OPEN) return

    if (turnStatus === 'recording') {
      // Stop capturing; onstop below sends the finished clip and waits for the backend's reply.
      recorderRef.current?.stop()
      return
    }

    if (turnStatus !== 'ready') return

    // The camera stream carries both video and audio tracks, but we only want
    // to record/send audio, and MediaRecorder rejects an audio-only mimeType
    // against a stream that also has a video track. Record from an audio-only
    // sub-stream built from the same underlying audio track instead.
    const audioOnlyStream = new MediaStream(stream.getAudioTracks())

    audioChunksRef.current = []
    const recorder = new MediaRecorder(audioOnlyStream, { mimeType: 'audio/webm' })
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data)
    }
    recorder.onstop = () => {
      const clip = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      audioChunksRef.current = []
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(clip)
        appendTranscript('me', '[sent recorded answer]')
        setTurnStatus('waiting')
      }
    }

    recorder.start()
    recorderRef.current = recorder
    setTurnStatus('recording')
  }

  const recordButtonLabel = {
    ready: 'Record answer',
    recording: 'Stop & send',
    waiting: 'Waiting for response...',
  }[turnStatus]

  if (loadError) {
    return (
      <div className="page">
        <p className="form-error">{loadError}</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{interview ? `${interview.role} @ ${interview.company}` : 'Interview session'}</h1>
        <span className={`badge ws-badge ws-${sessionStatus}`}>{sessionStatus}</span>
      </div>

      <div className="interview-session-grid">
        <div className="camera-panel">
          <video ref={videoRef} autoPlay playsInline muted className="camera-preview" />
          {cameraError && <p className="form-error">{cameraError}</p>}

          <div className="record-controls">
            {sessionStatus === 'idle' && (
              <button type="button" className="button" onClick={handleStartInterview}>
                Start interview
              </button>
            )}
            {sessionStatus === 'connecting' && (
              <button type="button" className="button" disabled>
                Connecting...
              </button>
            )}
            {sessionStatus === 'active' && (
              <>
                <button
                  type="button"
                  className="button"
                  onClick={handleToggleRecording}
                  disabled={turnStatus === 'waiting'}
                >
                  {recordButtonLabel}
                </button>
                <button type="button" className="button button-danger" onClick={handleEndInterview}>
                  End interview
                </button>
              </>
            )}
            {sessionStatus === 'ended' && (
              <Link to="/dashboard" className="button">
                Back to dashboard
              </Link>
            )}
          </div>
        </div>

        <div className="transcript-panel">
          <h2>Session</h2>
          <div className="transcript-messages">
            {transcript.length === 0 && (
              <p className="transcript-empty">Click "Start interview" to begin.</p>
            )}
            {transcript.map((entry) => (
              <p key={entry.id} className={`transcript-entry transcript-${entry.from}`}>
                {entry.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
