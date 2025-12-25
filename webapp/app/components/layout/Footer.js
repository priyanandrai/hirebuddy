export default function Footer() {
    return (
      <footer className="w-full bg-gray-50 border-t mt-10">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-gray-600">
          <div className="flex flex-wrap justify-center gap-6 mb-3">
            <a href="#" className="hover:text-black">
              About Us
            </a>
            <a href="#" className="hover:text-black">
              How it Works
            </a>
            <a href="#" className="hover:text-black">
              Support
            </a>
            <a href="#" className="hover:text-black">
              Terms
            </a>
            <a href="#" className="hover:text-black">
              Privacy Policy
            </a>
          </div>
  
          <p className="text-xs text-gray-500">
            Trusted local helpers for all your daily needs.
          </p>
        </div>
      </footer>
    );
  }
  