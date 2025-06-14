
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="text-center animate-fade-in max-w-2xl mx-auto px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl mb-6 shadow-2xl">
          <span className="text-3xl">✨</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
          Welcome to Your App
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
          Start building your amazing project with powerful tools and professional insights!
        </p>
        <Button 
          size="lg" 
          onClick={() => navigate("/seo-checkup")}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <span className="flex items-center gap-3">
            🚀 SEO Site Checkup
          </span>
        </Button>
      </div>
    </div>
  );
};

export default Index;
