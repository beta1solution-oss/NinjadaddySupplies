import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F5F5F2] flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-[#E6C200] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-black" />
        </div>
        <h1 className="text-8xl font-900 text-[#111111] mb-4 tracking-tight">404</h1>
        <h2 className="text-2xl font-800 text-[#111111] mb-4">Page Not Found</h2>
        <p className="text-[#888888] font-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#E6C200] text-black font-800 rounded-xl hover:bg-[#B8A000] transition-colors">
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
