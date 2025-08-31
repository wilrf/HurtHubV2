import { Dialog, Transition } from '@headlessui/react'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'

import { cn } from '@/utils'

import { Button } from './Button'

const modalVariants = cva(
  'relative transform overflow-hidden rounded-2xl text-left align-middle transition-all',
  {
    variants: {
      size: {
        sm: 'w-full max-w-md',
        default: 'w-full max-w-lg',
        lg: 'w-full max-w-2xl',
        xl: 'w-full max-w-4xl',
        full: 'w-full max-w-7xl',
      },
      variant: {
        default: 'bg-background shadow-hard border border-border',
        glass: 'bg-glass backdrop-blur-xl border border-glass-border shadow-glow',
        midnight: 'bg-midnight-900 border border-midnight-700 shadow-midnight text-white',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

export interface ModalProps extends VariantProps<typeof modalVariants> {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  className?: string
  overlayClassName?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size,
  variant,
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
  overlayClassName,
}: ModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as='div'
        className='relative z-50'
        onClose={closeOnOverlayClick ? onClose : () => {}}
      >
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div 
            className={cn(
              'fixed inset-0 bg-backdrop backdrop-blur-sm',
              overlayClassName
            )} 
          />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4 text-center'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <Dialog.Panel
                className={cn(modalVariants({ size, variant }), className)}
              >
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className='flex items-center justify-between p-6 pb-4'>
                    <div className='space-y-1'>
                      {title && (
                        <Dialog.Title
                          as='h3'
                          className='text-xl font-semibold leading-6'
                        >
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className='text-sm text-muted-foreground'>
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                    {showCloseButton && (
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        onClick={onClose}
                        className='rounded-full'
                        aria-label='Close modal'
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className={cn(
                  'px-6',
                  (title || showCloseButton) ? 'pb-6' : 'py-6'
                )}>
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

// Confirmation modal component
interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  isLoading?: boolean
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size='sm'
      closeOnOverlayClick={!isLoading}
      showCloseButton={false}
    >
      <div className='space-y-6'>
        <div className='flex gap-3 justify-end'>
          <Button
            variant='outline'
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            isLoading={isLoading}
            loadingText='Processing...'
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

Modal.displayName = 'Modal'
ConfirmationModal.displayName = 'ConfirmationModal'