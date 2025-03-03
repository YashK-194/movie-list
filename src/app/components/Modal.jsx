export default function Modal({ isOpen, onClose, children }) {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-opacity-40 backdrop-blur-md z-50">
        <div className="relative bg-white p-6 md:p-8 rounded-2xl shadow-2xl max-w-lg w-full text-gray-900">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✖
          </button>
  
          {/* Modal Content */}
          <div className="text-lg font-semibold">{children}</div>
        </div>
      </div>
    );
  }
  