import React, { useCallback } from 'react'

interface ResizeHandleProps {
  noteId: string
  currentWidth: number
  currentHeight: number
  onResize: (size: { width: number; height: number }) => void
}

const MIN_WIDTH = 240
const MIN_HEIGHT = 200

const ResizeHandle = ({
  noteId,
  currentWidth,
  currentHeight,
  onResize
}: ResizeHandleProps): JSX.Element => {
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      e.preventDefault()

      const startX = e.clientX
      const startY = e.clientY
      const startWidth = currentWidth
      const startHeight = currentHeight

      const onMouseMove = (moveEvent: MouseEvent): void => {
        const deltaX = moveEvent.clientX - startX
        const deltaY = moveEvent.clientY - startY
        const newWidth = Math.max(MIN_WIDTH, startWidth + deltaX)
        const newHeight = Math.max(MIN_HEIGHT, startHeight + deltaY)
        onResize({ width: newWidth, height: newHeight })
      }

      const onMouseUp = (): void => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [noteId, currentWidth, currentHeight, onResize]
  )

  return (
    <div
      onMouseDown={handleMouseDown}
      title="Drag to resize"
      style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderWidth: '0 0 12px 12px',
        borderColor: 'transparent transparent #cbd5e1 transparent',
        cursor: 'nwse-resize',
        zIndex: 10
      }}
    />
  )
}

export default ResizeHandle
