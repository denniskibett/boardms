'use client'

import { useEffect, useRef } from 'react'
import Button from '../button/Button'

interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  error: string
  details?: any
}

export default function ErrorModal({ isOpen, onClose, error, details }: ErrorModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Prevent background scrolling when modal is open
      document.body.style.overflow = 'hidden'
      document.body.style.pointerEvents = 'none'
      
      // Re-enable pointer events for the modal only
      if (modalRef.current) {
        modalRef.current.style.pointerEvents = 'auto'
      }

      // Prevent navigation using browser back button
      const handlePopState = (event: PopStateEvent) => {
        window.history.pushState(null, '', window.location.href)
        event.preventDefault()
      }

      window.history.pushState(null, '', window.location.href)
      window.addEventListener('popstate', handlePopState)

      return () => {
        window.removeEventListener('popstate', handlePopState)
        document.body.style.overflow = 'unset'
        document.body.style.pointerEvents = 'auto'
      }
    } else {
      document.body.style.overflow = 'unset'
      document.body.style.pointerEvents = 'auto'
    }
  }, [isOpen])

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()} // Prevent click from closing modal
      >
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
            Authentication Error
          </h3>
        </div>

        <div className="mt-2">
          <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
            {error}
          </p>

          {details && (
            <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Debug Details:
              </h4>
              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-32">
                {JSON.stringify(details, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onClose()
              // Optional: Clear form fields
              const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement
              const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement
              if (emailInput) emailInput.value = ''
              if (passwordInput) passwordInput.value = ''
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}