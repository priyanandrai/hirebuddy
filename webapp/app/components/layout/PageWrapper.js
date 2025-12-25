export default function PageWrapper({ title, children }) {
    return (
      <div className="space-y-4">
        {title && (
          <h2 className="text-xl font-semibold text-gray-900">
            {title}
          </h2>
        )}
  
        <div className="bg-white rounded-xl shadow-sm p-6">
          {children}
        </div>
      </div>
    );
  }
  