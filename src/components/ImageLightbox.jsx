// Full-screen zoomed view of an image — click the backdrop to close,
// matching the "open in Explorer" behavior requested for the QRIS code.
export default function ImageLightbox({ src, alt, onClose }) {
  if (!src) return null

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full rounded-xl"
        style={{ backgroundColor: '#fff', padding: '12px' }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
